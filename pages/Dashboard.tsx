import React, { useEffect, useState } from 'react';
import { FitnessPlan } from '../types';
import { storageService } from '../services/storageService';
import { PlanCard } from '../components/PlanCard';
import { Plus, Settings, Activity, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load plans and filter out any corrupted ones
    const loadedPlans = storageService.getPlans().filter(p => p.days && Array.isArray(p.days) && p.days.length > 0);
    setPlans(loadedPlans);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      storageService.deletePlan(id);
      const updatedPlans = storageService.getPlans().filter(p => p.days && Array.isArray(p.days) && p.days.length > 0);
      setPlans(updatedPlans);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your active fitness journeys</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/settings')}
            className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/create')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 rotate-3">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No plans yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
            Generate your first AI-powered workout and diet plan to get started.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Create Plan →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};