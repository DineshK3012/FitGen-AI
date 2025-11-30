import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FitnessPlan, AlternativeOption } from '../types';
import { storageService } from '../services/storageService';
import { getAlternatives } from '../services/geminiService';
import { AIImageEditor } from '../components/AIImageEditor';
import { ArrowLeft, Clock, Flame, Dumbbell, Utensils, Printer, RefreshCw, Save, Shuffle, Volume2, X, Loader2, User, Info, Square, Trash2, Droplet, Wheat, Beef, Bookmark } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';

export const PlanViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDraft = new URLSearchParams(location.search).get('draft') === 'true';

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  
  const [playingText, setPlayingText] = useState<string | null>(null);

  // Substitution State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subItem, setSubItem] = useState<{ id: string, name: string, type: 'Exercise' | 'Meal' } | null>(null);
  const [subQuery, setSubQuery] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subOptions, setSubOptions] = useState<AlternativeOption[]>([]);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Rate Limiter
  const { checkLimit: checkAltLimit } = useRateLimit('alt_gen', { limit: 10, interval: 120000 });

  useEffect(() => {
    if (id) {
      const foundPlan = storageService.getPlanById(id);
      setPlan(foundPlan || null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleUpdateImage = useCallback((itemId: string, newUrl: string) => {
    setGeneratedImages(prev => ({ ...prev, [itemId]: newUrl }));
  }, []);

  const handleRegenerate = useCallback(() => {
    if(plan?.preferences) {
        navigate('/create', { state: { preferences: plan.preferences } });
    } else {
        if(window.confirm("No saved preferences found for this plan. Start fresh?")) {
            navigate('/create');
        }
    }
  }, [plan, navigate]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (plan) {
      storageService.deletePlan(plan.id);
      toast.success("Plan deleted");
      navigate('/dashboard');
    }
  }, [plan, navigate]);

  const handleSavePlan = useCallback(() => {
    if (plan) {
      storageService.savePlan(plan);
      storageService.clearDraft();
      toast.success("Plan saved!");
      navigate(`/plan/${plan.id}`);
    }
  }, [plan, navigate]);

  const handleSpeak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-Speech not supported.");
      return;
    }

    if (playingText === text) {
      window.speechSynthesis.cancel();
      setPlayingText(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      
      utterance.onend = () => setPlayingText(null);
      utterance.onerror = (e) => {
          // Ignore interruption errors caused by manual stop or page navigation
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
              setPlayingText(null);
              toast.error("Audio playback error");
          }
      };
      
      setPlayingText(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [playingText]);

  const renderInstructions = useCallback((instructions?: string[]) => {
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return <p className="text-sm text-slate-500 italic">No specific instructions.</p>;
    }

    return (
      <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        {instructions.map((step, i) => (
          <li key={i} className="leading-relaxed pl-1">
             {step}
          </li>
        ))}
      </ol>
    );
  }, []);

  // Calculate daily macros
  const dailyMacros = useMemo(() => {
    if (!plan?.days[activeDayIndex]?.meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return plan.days[activeDayIndex].meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [plan, activeDayIndex]);

  const openSubModal = useCallback((id: string, name: string, type: 'Exercise' | 'Meal') => {
    setSubItem({ id, name, type });
    setSubQuery('');
    setSubOptions([]);
    setSubModalOpen(true);
  }, []);

  const fetchAlternatives = useCallback(async () => {
    if (!subItem || !subQuery.trim()) return;
    
    if (!checkAltLimit()) return;

    setSubLoading(true);
    try {
      const alts = await getAlternatives(subItem.name, subItem.type, subQuery);
      setSubOptions(alts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to find alternatives");
    } finally {
      setSubLoading(false);
    }
  }, [subItem, subQuery, checkAltLimit]);

  const handleApplySubstitution = useCallback((alt: AlternativeOption) => {
    if (!plan || !subItem) return;
    
    const newPlan = { ...plan };
    const day = newPlan.days[activeDayIndex];

    if (subItem.type === 'Exercise') {
      const idx = day.workout.findIndex(w => w.id === subItem.id);
      if (idx !== -1) {
        day.workout[idx] = { ...day.workout[idx], name: alt.name, ...alt.data };
      }
    } else {
      const idx = day.meals.findIndex(m => m.id === subItem.id);
      if (idx !== -1) {
        day.meals[idx] = { ...day.meals[idx], name: alt.name, ...alt.data };
      }
    }

    setPlan(newPlan);
    if (isDraft) storageService.saveDraftPlan(newPlan);
    else storageService.updatePlan(newPlan);
    
    setSubModalOpen(false);
    toast.success("Item substituted");
  }, [plan, subItem, activeDayIndex, isDraft]);

  const activeDay = plan?.days?.[activeDayIndex];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  if (!plan || !activeDay) return <div className="min-h-screen flex items-center justify-center"><p>Plan Not Found</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      
      {/* --- PRINT LAYOUT --- */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[210mm] mx-auto print-avoid-break">
         <div className="flex justify-between items-center mb-6 border-b-2 border-indigo-600 pb-4">
             <div>
                <h1 className="text-2xl font-bold text-slate-900">FitGen AI Plan</h1>
             </div>
             <div className="text-right">
                <p className="text-lg font-bold">{plan.userName}</p>
                <p className="text-sm text-slate-500">{plan.goal}</p>
             </div>
         </div>

         {/* Diet Section */}
         <div className="mb-8">
            <h2 className="text-xl font-bold text-indigo-700 mb-2">Nutrition Plan</h2>
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-left">
                        <th className="p-2 w-1/5">Meal</th>
                        <th className="p-2 w-1/4">Food</th>
                        <th className="p-2 w-1/3">Prep</th>
                        <th className="p-2">Macros</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.days.map(day => (
                        <React.Fragment key={day.day}>
                            <tr><td colSpan={4} className="font-bold py-2 bg-slate-50 border-b border-slate-200 px-2 uppercase">{day.day}</td></tr>
                            {day.meals.map(meal => (
                                <tr key={meal.id} className="border-b border-slate-100">
                                    <td className="p-2 align-top font-bold">{meal.name} <span className="text-slate-500 font-normal">({meal.calories} kcal)</span></td>
                                    <td className="p-2 align-top">{meal.ingredients.join(', ')}</td>
                                    <td className="p-2 align-top"><ul className="list-disc list-inside">{Array.isArray(meal.recipe) && meal.recipe.map((step, i) => <li key={i}>{step}</li>)}</ul></td>
                                    <td className="p-2 align-top font-mono">P:{meal.protein} C:{meal.carbs} F:{meal.fat}</td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
         </div>

         <div className="print-break"></div>

         {/* Workout Section */}
         <div className="pt-4">
            <h2 className="text-xl font-bold text-indigo-700 mb-2">Workout Routine</h2>
             <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-left">
                        <th className="p-2 w-1/4">Exercise</th>
                        <th className="p-2 w-1/6">Sets x Reps</th>
                        <th className="p-2 w-1/6">Rest</th>
                        <th className="p-2">Instructions</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.days.map(day => (
                         <React.Fragment key={day.day}>
                            <tr><td colSpan={4} className="font-bold py-2 bg-slate-50 border-b border-slate-200 px-2 uppercase">{day.day}</td></tr>
                            {day.workout.map(ex => (
                                <tr key={ex.id} className="border-b border-slate-100">
                                    <td className="p-2 align-top font-bold">{ex.name}<div className="italic font-normal text-indigo-600 mt-1">{ex.notes}</div></td>
                                    <td className="p-2 align-top">{ex.sets} x {ex.reps}</td>
                                    <td className="p-2 align-top">{ex.rest}</td>
                                    <td className="p-2 align-top"><ol className="list-decimal list-inside">{Array.isArray(ex.instructions) && ex.instructions.map((step, i) => <li key={i}>{step}</li>)}</ol></td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
         </div>
      </div>

      {/* --- SCREEN UI --- */}
      <div className="print:hidden">
        {/* Floating Save Button */}
        {isDraft && (
            <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={handleSavePlan} 
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full font-bold shadow-2xl shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-100"
            >
                <Bookmark className="w-5 h-5" />
                Save to Dashboard
            </button>
            </div>
        )}

        {/* Toolbar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">{plan.goal}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <User size={10} /> {plan.userName}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2 text-sm overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                    {!isDraft && (
                        <button onClick={handleDeleteClick} className="flex-shrink-0 flex items-center gap-1.5 text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                    <button onClick={handleRegenerate} className="flex-shrink-0 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <RefreshCw size={14} /> Regenerate
                    </button>
                    <button onClick={() => window.print()} className="flex-shrink-0 flex items-center gap-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors">
                        <Printer size={14} /> Export PDF
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Day Selector */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
            {plan.days.map((day, idx) => (
                <button
                key={idx}
                onClick={() => setActiveDayIndex(idx)}
                className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-sm font-semibold transition-all flex-shrink-0 border ${
                    idx === activeDayIndex 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
                >
                {day.day}
                </button>
            ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeDayIndex}">
                
                {/* WORKOUT COLUMN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Workout</h2>
                    </div>

                    {activeDay.workout?.map((exercise) => {
                        const instructionText = Array.isArray(exercise.instructions) ? exercise.instructions.join('. ') : (exercise.instructions || '');
                        const textToSpeak = `${exercise.name}. ${instructionText} Tip: ${exercise.notes}`;
                        const isThisPlaying = playingText === textToSpeak;

                        return (
                            <div key={exercise.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exercise.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSpeak(textToSpeak)} className={`p-1.5 rounded-full border transition-colors ${isThisPlaying ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                                {isThisPlaying ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
                                            </button>
                                            <button onClick={() => openSubModal(exercise.id, exercise.name, 'Exercise')} className="p-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100">
                                                <Shuffle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center">
                                            <Clock size={12} className="mr-1"/> {exercise.rest} rest
                                        </span>
                                        <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                            {exercise.sets} sets × {exercise.reps}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            <Info size={12} /> Steps
                                        </div>
                                        {renderInstructions(exercise.instructions)}
                                    </div>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 italic">
                                        <span className="font-bold text-amber-600 not-italic mr-1">Tip:</span> {exercise.notes}
                                    </div>
                                    <AIImageEditor 
                                        initialPrompt={`Fitness photo of ${exercise.name} exercise, perfect form, gym setting`}
                                        contextType="Exercise"
                                        currentImageUrl={generatedImages[exercise.id]}
                                        onImageUpdate={(url) => handleUpdateImage(exercise.id, url)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* NUTRITION COLUMN */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nutrition</h2>
                        </div>
                        {/* Daily Macros Badge */}
                        <div className="hidden sm:flex gap-3 text-xs font-bold bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex flex-col items-center px-2 border-r border-slate-100 dark:border-slate-700">
                                <span className="text-slate-400 uppercase text-[10px]">Cals</span>
                                <span className="text-slate-900 dark:text-white">{dailyMacros.calories}</span>
                            </div>
                            <div className="flex flex-col items-center px-2 border-r border-slate-100 dark:border-slate-700">
                                <span className="text-slate-400 uppercase text-[10px]">Prot</span>
                                <span className="text-emerald-600">{dailyMacros.protein}g</span>
                            </div>
                            <div className="flex flex-col items-center px-2 border-r border-slate-100 dark:border-slate-700">
                                <span className="text-slate-400 uppercase text-[10px]">Carb</span>
                                <span className="text-amber-600">{dailyMacros.carbs}g</span>
                            </div>
                            <div className="flex flex-col items-center px-2">
                                <span className="text-slate-400 uppercase text-[10px]">Fat</span>
                                <span className="text-rose-600">{dailyMacros.fat}g</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Macros */}
                    <div className="sm:hidden grid grid-cols-4 gap-2 text-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                         <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Cals</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{dailyMacros.calories}</span>
                         </div>
                         <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Pro</span>
                            <span className="text-sm font-bold text-emerald-500">{dailyMacros.protein}g</span>
                         </div>
                         <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Carb</span>
                            <span className="text-sm font-bold text-amber-500">{dailyMacros.carbs}g</span>
                         </div>
                         <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Fat</span>
                            <span className="text-sm font-bold text-rose-500">{dailyMacros.fat}g</span>
                         </div>
                    </div>

                    {activeDay.meals?.map((meal) => {
                        const recipeText = Array.isArray(meal.recipe) ? meal.recipe.join('. ') : (meal.recipe || '');
                        const textToSpeak = `${meal.name}. Ingredients: ${meal.ingredients.join(', ')}. Instructions: ${recipeText}`;
                        const isThisPlaying = playingText === textToSpeak;

                        return (
                            <div key={meal.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{meal.name}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSpeak(textToSpeak)} className={`p-1.5 rounded-full border transition-colors ${isThisPlaying ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                                                {isThisPlaying ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
                                            </button>
                                            <button onClick={() => openSubModal(meal.id, meal.name, 'Meal')} className="p-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100">
                                                <Shuffle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-900/30 w-fit">
                                        <Flame size={12} className="mr-1" /> {meal.calories} kcal
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1"><Beef size={10}/> Pro</div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{meal.protein}g</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1"><Wheat size={10}/> Carb</div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{meal.carbs}g</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded text-center border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-center gap-1"><Droplet size={10}/> Fat</div>
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-xs">{meal.fat}g</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Ingredients</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {meal.ingredients.map((ing, i) => (
                                                <span key={i} className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                    {ing}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Prep</div>
                                        {renderInstructions(meal.recipe)}
                                    </div>
                                    <AIImageEditor 
                                        initialPrompt={`Delicious food photo of ${meal.name}, gourmet plating`}
                                        contextType="Meal"
                                        currentImageUrl={generatedImages[meal.id]}
                                        onImageUpdate={(url) => handleUpdateImage(meal.id, url)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Substitution Modal */}
        {subModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Substitute Item</h3>
                        <button onClick={() => setSubModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                    </div>
                    <div className="p-5 overflow-y-auto">
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={subQuery}
                                onChange={(e) => setSubQuery(e.target.value)}
                                placeholder="Reason (e.g. Allergy, No Equipment)" 
                                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button onClick={fetchAlternatives} disabled={!subQuery.trim() || subLoading} className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50">
                                {subLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Shuffle className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {subOptions.map((opt, idx) => (
                                <button key={idx} onClick={() => handleApplySubstitution(opt)} className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-800 transition-all">
                                    <div className="font-bold text-slate-900 dark:text-white">{opt.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{opt.reason}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Plan"
          message="Are you sure you want to permanently delete this plan? This action cannot be undone."
          confirmText="Delete"
          isDestructive={true}
        />
      </div>
    </div>
  );
};