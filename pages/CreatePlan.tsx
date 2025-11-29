
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateFitnessPlan, getDemoPlan } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { UserPreferences, LoadingState } from '../types';
import { Loader2, ArrowRight, ArrowLeft, Check, AlertCircle, Sparkles, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Fitness Profile' },
  { id: 3, title: 'Preferences & Constraints' }
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CreatePlan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserPreferences>({
    name: '',
    age: 25,
    gender: 'Male',
    weight: 70,
    height: 175,
    goal: 'Muscle Gain',
    level: 'Beginner',
    equipment: 'Gym',
    diet: 'No Restrictions',
    workoutDays: ['Mon', 'Wed', 'Fri'],
    injuries: 'None',
    allergies: 'None',
    medications: 'None',
    remarks: ''
  });

  // Load preferences if passed via navigation (Regenerate flow)
  useEffect(() => {
    if (location.state && location.state.preferences) {
      setFormData(location.state.preferences);
      // Optional: Jump to last step or verify data
    }
  }, [location.state]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (step === 1) {
      if (!formData.name.trim()) errors.name = "Name is required";
      if (formData.age < 12 || formData.age > 100) errors.age = "Please enter a valid age (12-100)";
      if (formData.weight < 30 || formData.weight > 300) errors.weight = "Please enter a valid weight (30-300 kg)";
      if (formData.height < 100 || formData.height > 250) errors.height = "Please enter a valid height (100-250 cm)";
    }

    if (step === 3) {
      if (formData.workoutDays.length === 0) errors.workoutDays = "Please select at least one workout day";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      isValid = false;
    } else {
      setValidationErrors({});
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(LoadingState.LOADING);
    setError(null);

    try {
      if (!storageService.getApiKey()) {
        throw new Error("Please set your Gemini API Key in Settings first.");
      }
      const plan = await generateFitnessPlan(formData);
      // Save as DRAFT (Temporary)
      storageService.saveDraftPlan(plan);
      setLoading(LoadingState.SUCCESS);
      navigate(`/plan/${plan.id}?draft=true`);
    } catch (err) {
      setLoading(LoadingState.ERROR);
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    }
  };

  const handleDemoPlan = () => {
    setLoading(LoadingState.LOADING);
    setTimeout(() => {
      const demo = getDemoPlan();
      demo.id = crypto.randomUUID(); 
      demo.createdAt = Date.now();
      demo.userName = formData.name || 'Demo User';
      storageService.saveDraftPlan(demo);
      setLoading(LoadingState.SUCCESS);
      navigate(`/plan/${demo.id}?draft=true`);
    }, 1000);
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const days = prev.workoutDays.includes(day)
        ? prev.workoutDays.filter(d => d !== day)
        : [...prev.workoutDays, day];
      return { ...prev, workoutDays: days };
    });
  };

  if (loading === LoadingState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20"
        >
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Designing Your Plan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md text-lg">
          Gemini is analyzing your bio, calculating macros, and crafting the perfect routine for you...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div></div>
        <button
          onClick={handleDemoPlan}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Sparkles size={16} />
          Try Demo Plan (No API Key)
        </button>
      </div>

      <div className="mb-12">
        <div className="flex justify-between mb-4">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center w-1/3 relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 z-10 ${
                  currentStep >= step.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {currentStep > step.id ? <Check size={20} /> : step.id}
              </div>
              <span className={`mt-2 text-xs font-medium ${currentStep >= step.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                {step.title}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-[2px] -z-0">
                   <div className={`h-full ${currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 transition-colors">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-1">Error Generating Plan</p>
                <p className="text-sm mb-3">{error}</p>
                <button 
                  onClick={handleDemoPlan}
                  className="text-sm font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                >
                  <PlayCircle size={14} />
                  Load Demo Plan Instead
                </button>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Tell us about yourself</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="John Doe"
                  />
                  {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                  {validationErrors.age && <p className="text-red-500 text-xs mt-1">{validationErrors.age}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    {validationErrors.weight && <p className="text-red-500 text-xs mt-1">{validationErrors.weight}</p>}
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    {validationErrors.height && <p className="text-red-500 text-xs mt-1">{validationErrors.height}</p>}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Your Fitness Profile</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Goal</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Muscle Gain', 'Weight Loss', 'Endurance', 'Flexibility', 'General Health'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFormData({...formData, goal: opt})}
                        className={`p-4 rounded-xl text-sm font-medium border transition-all ${
                          formData.goal === opt 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Experience Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    <option>Beginner (0-1 years)</option>
                    <option>Intermediate (1-3 years)</option>
                    <option>Advanced (3+ years)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Equipment Available</label>
                  <select
                    value={formData.equipment}
                    onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    <option>Full Commercial Gym</option>
                    <option>Home Gym (Dumbbells & Bench)</option>
                    <option>Dumbbells Only</option>
                    <option>Bodyweight Only (No Equipment)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Preferences & Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Which days can you workout?</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-12 h-12 rounded-full text-sm font-semibold transition-all ${
                        formData.workoutDays.includes(day)
                          ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {validationErrors.workoutDays && <p className="text-red-500 text-xs mt-2">{validationErrors.workoutDays}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dietary Preference</label>
                <select
                  value={formData.diet}
                  onChange={(e) => setFormData({...formData, diet: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                >
                  <option>No Restrictions</option>
                  <option>Vegetarian</option>
                  <option>Vegan</option>
                  <option>Keto</option>
                  <option>Paleo</option>
                  <option>Pescatarian</option>
                  <option>Gluten-Free</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Injuries (if any)</label>
                  <input
                    type="text"
                    value={formData.injuries}
                    onChange={(e) => setFormData({...formData, injuries: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="e.g. Lower back pain, bad left knee..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Allergies (if any)</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="e.g. Peanuts, Shellfish..."
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Medications / Conditions</label>
                  <input
                    type="text"
                    value={formData.medications}
                    onChange={(e) => setFormData({...formData, medications: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    placeholder="e.g. Asthma, High Blood Pressure..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Additional Remarks / Requests</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 dark:text-white h-24 resize-none"
                    placeholder="e.g. I prefer shorter workouts, I hate burpees..."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
              currentStep === 1 
                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {currentStep < 3 ? (
             <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30"
              >
                Generate Plan
                <Check className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
