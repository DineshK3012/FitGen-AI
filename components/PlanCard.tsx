import React from 'react';
import { FitnessPlan } from '../types';
import { Calendar, ChevronRight, Trash2, Dumbbell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  plan: FitnessPlan;
  onDelete: (id: string) => void;
}

export const PlanCard: React.FC<Props> = ({ plan, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
      
      {/* Header with Name */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wide">
             <User size={12} />
             {plan.userName || 'User'}
          </div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {plan.goal}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center mt-2 font-medium">
            <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
            {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
          className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors"
          title="Delete Plan"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      <div className="mb-6 flex-grow relative z-10">
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 mb-3 border border-indigo-100 dark:border-indigo-800">
          <Dumbbell className="w-3 h-3 mr-1" />
          {plan.duration || 'Fitness Plan'}
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">
          {plan.summary}
        </p>
      </div>

      <button 
        onClick={() => navigate(`/plan/${plan.id}`)}
        className="relative z-10 w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-600 flex items-center justify-center transition-all duration-200"
      >
        View Full Plan
        <ChevronRight className="w-4 h-4 ml-1.5" />
      </button>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
};