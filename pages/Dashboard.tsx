
import React, { useEffect, useState } from 'react';
import { FitnessPlan } from '../types';
import { storageService } from '../services/storageService';
import { PlanCard } from '../components/PlanCard';
import { Plus, Settings, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [plans, setPlans] = useState<FitnessPlan[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load plans and filter out any corrupted ones that might crash the app
    const loadedPlans = storageService.getPlans().filter(p => p.days && Array.isArray(p.days) && p.days.length > 0);
    setPlans(loadedPlans);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      storageService.deletePlan(id);
      // Force reload from storage to ensure state matches persistence
      const updatedPlans = storageService.getPlans().filter(p => p.days && Array.isArray(p.days) && p.days.length > 0);
      setPlans(updatedPlans);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your AI-generated fitness plans</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/settings')}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => navigate('/create')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 dark:text-yellow-600" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
            <Activity className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">No plans created yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center text-lg">
            Start your transformation today. Let our AI design a custom workout and diet routine just for you.
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-indigo-500/30"
          >
            Create Your First Plan
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
