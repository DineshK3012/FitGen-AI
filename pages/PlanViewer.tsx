
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FitnessPlan, AlternativeOption } from '../types';
import { storageService } from '../services/storageService';
import { getAlternatives } from '../services/geminiService';
import { AIImageEditor } from '../components/AIImageEditor';
import { ArrowLeft, Clock, Flame, Dumbbell, Utensils, Printer, RefreshCw, AlertTriangle, FileQuestion, Save, Shuffle, Volume2, X, Check, Loader2, User, Info, Square, Trash2 } from 'lucide-react';

export const PlanViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isDraft = new URLSearchParams(location.search).get('draft') === 'true';

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  
  // Audio State
  const [playingText, setPlayingText] = useState<string | null>(null);

  // Substitution State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subItem, setSubItem] = useState<{ id: string, name: string, type: 'Exercise' | 'Meal' } | null>(null);
  const [subQuery, setSubQuery] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [subOptions, setSubOptions] = useState<AlternativeOption[]>([]);

  useEffect(() => {
    if (id) {
      const foundPlan = storageService.getPlanById(id);
      setPlan(foundPlan || null);
    }
    setLoading(false);
  }, [id]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleUpdateImage = (itemId: string, newUrl: string) => {
    setGeneratedImages(prev => ({ ...prev, [itemId]: newUrl }));
  };

  const handleRegenerate = () => {
    if(plan?.preferences) {
        navigate('/create', { state: { preferences: plan.preferences } });
    } else {
        if(window.confirm("No saved preferences found for this plan. Start fresh?")) {
            navigate('/create');
        }
    }
  };

  const handleDeletePlan = () => {
    if (window.confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
      if (plan) {
        storageService.deletePlan(plan.id);
        navigate('/dashboard');
      }
    }
  };

  const handleSavePlan = () => {
    if (plan) {
      storageService.savePlan(plan);
      storageService.clearDraft();
      alert("Plan saved successfully to Dashboard!");
      navigate(`/plan/${plan.id}`);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech not supported in this browser.");
      return;
    }

    if (playingText === text) {
      // Stop if clicking same button
      window.speechSynthesis.cancel();
      setPlayingText(null);
    } else {
      // Play new text
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.onend = () => setPlayingText(null);
      utterance.onerror = () => setPlayingText(null);
      setPlayingText(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderInstructions = (instructions?: string[]) => {
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
      return <p className="text-sm text-slate-700 dark:text-slate-300">Follow standard form.</p>;
    }

    return (
      <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
        {instructions.map((step, i) => (
          <li key={i} className="leading-relaxed">
            <span className="font-medium text-slate-900 dark:text-white"></span> {step}
          </li>
        ))}
      </ol>
    );
  };

  // Substitution Logic
  const openSubModal = (id: string, name: string, type: 'Exercise' | 'Meal') => {
    setSubItem({ id, name, type });
    setSubQuery('');
    setSubOptions([]);
    setSubModalOpen(true);
  };

  const fetchAlternatives = async () => {
    if (!subItem || !subQuery.trim()) return;
    setSubLoading(true);
    try {
      const alts = await getAlternatives(subItem.name, subItem.type, subQuery);
      setSubOptions(alts);
    } catch (e) {
      alert("Failed to get alternatives. Try again.");
    } finally {
      setSubLoading(false);
    }
  };

  const handleApplySubstitution = (alt: AlternativeOption) => {
    if (!plan || !subItem) return;
    
    const newPlan = { ...plan };
    const day = newPlan.days[activeDayIndex];

    if (subItem.type === 'Exercise') {
      const idx = day.workout.findIndex(w => w.id === subItem.id);
      if (idx !== -1) {
        day.workout[idx] = {
            ...day.workout[idx],
            name: alt.name,
            ...alt.data // Spread structured data (instructions, notes, sets, reps)
        };
      }
    } else {
      const idx = day.meals.findIndex(m => m.id === subItem.id);
      if (idx !== -1) {
        day.meals[idx] = {
            ...day.meals[idx],
            name: alt.name,
            ...alt.data // Spread structured data (recipe, macros, ingredients)
        };
      }
    }

    setPlan(newPlan);
    if (isDraft) {
      storageService.saveDraftPlan(newPlan);
    } else {
      storageService.updatePlan(newPlan);
    }
    setSubModalOpen(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;

  if (!plan) return <div className="min-h-screen flex items-center justify-center"><p>Plan Not Found</p></div>;
  
  if (!plan.days || plan.days.length === 0) return <div className="p-10 text-center">Incomplete Data</div>;

  const activeDay = plan.days[activeDayIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      
      {/* ------------------------ PRINT LAYOUT ------------------------ */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[210mm] mx-auto">
         
         {/* Branding Header */}
         <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-600 pb-4">
             <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">FitGen<span className="text-indigo-600">AI</span></h1>
                <p className="text-sm text-slate-500">Intelligent Personal Fitness</p>
             </div>
             <div className="text-right">
                <p className="text-lg font-bold">{plan.userName}</p>
                <p className="text-sm text-slate-500">{plan.goal}</p>
             </div>
         </div>

         {/* Diet Section Print */}
         <div className="mb-10 break-inside-avoid">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Utensils className="w-6 h-6" /> Nutrition Plan
            </h2>
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-indigo-100">
                <span className="font-semibold">Daily Calorie Target</span>
                <span className="text-xl font-bold text-indigo-700">{plan.totalCalories} kcal</span>
            </div>

            <table className="w-full border-collapse mb-8 text-sm">
                <thead>
                    <tr className="bg-slate-800 text-white">
                        <th className="p-3 text-left w-1/5">Meal</th>
                        <th className="p-3 text-left w-1/4">Food Items</th>
                        <th className="p-3 text-left w-1/3">Preparation</th>
                        <th className="p-3 text-left">Macros</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.days.map(day => (
                        <React.Fragment key={day.day}>
                            <tr><td colSpan={4} className="font-bold py-3 bg-slate-100 border-b border-slate-300 px-3 text-slate-700 uppercase tracking-wide text-xs">{day.day}</td></tr>
                            {day.meals.map(meal => (
                                <tr key={meal.id} className="border-b border-slate-200">
                                    <td className="p-3 align-top font-bold text-slate-800">
                                        {meal.name}
                                        <div className="text-xs font-normal text-slate-500 mt-1">{meal.calories} kcal</div>
                                    </td>
                                    <td className="p-3 align-top">{meal.ingredients.join(', ')}</td>
                                    <td className="p-3 align-top text-xs text-slate-600">
                                        <ul className="list-disc list-inside">
                                            {Array.isArray(meal.recipe) && meal.recipe.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="p-3 align-top text-xs font-mono">
                                        <div>P: {meal.protein}g</div>
                                        <div>C: {meal.carbs}g</div>
                                        <div>F: {meal.fat}g</div>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
         </div>

         <div className="print-break"></div>

         {/* Workout Section Print */}
         <div className="break-inside-avoid pt-8">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
                <Dumbbell className="w-6 h-6" /> Workout Routine
            </h2>
            
             <table className="w-full border-collapse mb-8 text-sm">
                <thead>
                    <tr className="bg-slate-800 text-white">
                        <th className="p-3 text-left w-1/4">Exercise</th>
                        <th className="p-3 text-left w-1/6">Sets x Reps</th>
                        <th className="p-3 text-left w-1/6">Rest</th>
                        <th className="p-3 text-left">Instructions</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.days.map(day => (
                         <React.Fragment key={day.day}>
                            <tr><td colSpan={4} className="font-bold py-3 bg-slate-100 border-b border-slate-300 px-3 text-slate-700 uppercase tracking-wide text-xs">{day.day}</td></tr>
                            {day.workout.map(ex => (
                                <tr key={ex.id} className="border-b border-slate-200">
                                    <td className="p-3 align-top font-bold text-slate-800">
                                        {ex.name}
                                        <div className="text-xs font-normal text-indigo-600 mt-1 italic">Tip: {ex.notes}</div>
                                    </td>
                                    <td className="p-3 align-top font-semibold">{ex.sets} x {ex.reps}</td>
                                    <td className="p-3 align-top">{ex.rest}</td>
                                    <td className="p-3 align-top text-xs text-slate-600">
                                        <ol className="list-decimal list-inside">
                                            {Array.isArray(ex.instructions) && ex.instructions.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
         </div>
         
         {/* Footer Print */}
         <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            Generated by FitGenAI • {new Date().toLocaleDateString()}
         </div>
      </div>
      {/* ---------------------------------------------------------------- */}


      {/* Main UI (Hidden when printing) */}
      <div className="print:hidden">
        {isDraft && (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
            <button onClick={handleSavePlan} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-full font-bold shadow-2xl transition-transform hover:scale-105">
                <Save className="w-5 h-5" /> Save This Plan
            </button>
            </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">
                    <User size={12} /> {plan.userName || 'User'}
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{plan.goal}</h1>
                </div>
            </div>
            
            <div className="flex gap-2 self-end sm:self-auto">
                {!isDraft && (
                    <button onClick={handleDeletePlan} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" /> <span>Delete</span>
                    </button>
                )}
                <button onClick={handleRegenerate} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <RefreshCw className="w-4 h-4" /> <span>Regenerate</span>
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> <span>Export PDF</span>
                </button>
            </div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex overflow-x-auto gap-3 mb-8 pb-2 scrollbar-hide snap-x">
            {plan.days.map((day, idx) => (
                <button
                key={idx}
                onClick={() => setActiveDayIndex(idx)}
                className={`snap-start px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all flex-shrink-0 border ${
                    idx === activeDayIndex ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
                >
                {day.day}
                </button>
            ))}
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeDayIndex}">
            {/* Workout Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Workout Routine</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Focus on form and consistency</p>
                </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeDay.workout?.map((exercise) => {
                   // Join instructions for speech
                   const instructionText = Array.isArray(exercise.instructions) ? exercise.instructions.join('. ') : (exercise.instructions || '');
                   const textToSpeak = `${exercise.name}. ${instructionText} ${exercise.notes}`;
                   const isThisPlaying = playingText === textToSpeak;

                   return (
                    <div key={exercise.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow relative group">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50">
                        <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exercise.name}</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSpeak(textToSpeak)}
                                className={`p-1.5 rounded-full border shadow-sm transition-colors ${
                                    isThisPlaying 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800'
                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}
                                title={isThisPlaying ? "Stop Audio" : "Read Instructions"}
                            >
                                {isThisPlaying ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
                            </button>
                            <button 
                                onClick={() => openSubModal(exercise.id, exercise.name, 'Exercise')}
                                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm"
                                title="Find Alternative"
                            >
                                <Shuffle size={16} />
                            </button>
                        </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-sm">
                        <span className="flex items-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                            <Clock className="w-3.5 h-3.5 mr-1.5" /> {exercise.rest} rest
                        </span>
                        <span className="font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                            {exercise.sets} sets × {exercise.reps}
                        </span>
                        </div>
                    </div>
                    
                    <div className="p-5">
                        <div className="mb-4">
                            <div className="flex items-start gap-2 mb-1">
                                <Info size={14} className="mt-0.5 text-slate-400" />
                                <span className="text-xs font-bold uppercase text-slate-400 tracking-wide">How to perform</span>
                            </div>
                            {renderInstructions(exercise.instructions)}
                        </div>
                        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 p-3 rounded-lg">
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                            <span className="font-bold not-italic text-yellow-600 dark:text-yellow-500 mr-1">Tip:</span> {exercise.notes}
                            </p>
                        </div>
                        
                        <AIImageEditor 
                            initialPrompt={`Fitness exercise demonstration of ${exercise.name}, cinematic lighting`}
                            contextType="Exercise"
                            currentImageUrl={generatedImages[exercise.id]}
                            onImageUpdate={(url) => handleUpdateImage(exercise.id, url)}
                        />
                    </div>
                    </div>
                   );
                })}
                </div>
            </section>

            {/* Diet Section */}
            <section>
                <div className="flex items-center gap-3 mb-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Utensils className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Nutrition</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Fuel your body right</p>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeDay.meals?.map((meal) => {
                    // Join recipe for speech
                    const recipeText = Array.isArray(meal.recipe) ? meal.recipe.join('. ') : (meal.recipe || '');
                    const textToSpeak = `${meal.name}. ${recipeText}`;
                    const isThisPlaying = playingText === textToSpeak;

                    return (
                    <div key={meal.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{meal.name}</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">
                            <Flame className="w-3.5 h-3.5 mr-1" /> {meal.calories} kcal
                            </div>
                            <div className="flex gap-2">
                                <button 
                                onClick={() => handleSpeak(textToSpeak)}
                                className={`p-1.5 rounded-full border shadow-sm transition-colors ${
                                    isThisPlaying 
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800'
                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}
                                title={isThisPlaying ? "Stop Audio" : "Read Recipe"}
                                >
                                {isThisPlaying ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
                                </button>
                                <button 
                                onClick={() => openSubModal(meal.id, meal.name, 'Meal')}
                                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm"
                                title="Find Alternative"
                            >
                                <Shuffle size={16} />
                                </button>
                            </div>
                        </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Protein</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{meal.protein}g</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Carbs</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{meal.carbs}g</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fat</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{meal.fat}g</span>
                        </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-5">
                        <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-2.5 tracking-wide">Ingredients</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {meal.ingredients.map((ing, i) => (
                            <span key={i} className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                {ing}
                            </span>
                            ))}
                        </div>
                        </div>
                        <div className="mb-5">
                        <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 mb-2 tracking-wide">Preparation / Instructions</h4>
                         {renderInstructions(meal.recipe)}
                        </div>

                        <AIImageEditor 
                        initialPrompt={`Gourmet food photography of ${meal.name}`}
                        contextType="Meal"
                        currentImageUrl={generatedImages[meal.id]}
                        onImageUpdate={(url) => handleUpdateImage(meal.id, url)}
                        />
                    </div>
                    </div>
                    );
                })}
                </div>
            </section>
            </div>
        </div>

        {/* Substitution Modal */}
        {subModalOpen && subItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-indigo-600" />
                    Substitute {subItem.type}
                </h3>
                <button onClick={() => setSubModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20} />
                </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Replacing <span className="font-bold text-slate-900 dark:text-white">{subItem.name}</span>. Tell us why you need a change.
                </p>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Reason for substitution</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={subQuery}
                        onChange={(e) => setSubQuery(e.target.value)}
                        placeholder="e.g. No equipment, allergy, too hard..." 
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                    <button 
                        onClick={fetchAlternatives}
                        disabled={!subQuery.trim() || subLoading}
                        className="bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                    >
                        {subLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Find Alternatives'}
                    </button>
                    </div>
                </div>

                {subOptions.length > 0 && (
                    <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Suggestions</p>
                    {subOptions.map((opt, idx) => (
                        <button 
                        key={idx}
                        onClick={() => handleApplySubstitution(opt)}
                        className="w-full text-left p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group shadow-sm"
                        >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-base">{opt.name}</span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded self-start">
                                {/* Display minimal details for quick scanning */}
                                {opt.data?.sets ? `${opt.data.sets}x${opt.data.reps}` : `${opt.data?.calories}kcal`}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                            {opt.reason}
                        </p>
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};