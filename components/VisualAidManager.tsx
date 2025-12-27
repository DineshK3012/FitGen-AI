import React, { useState } from 'react';
import { AIImageEditor } from './AIImageEditor';
import { VideoTutorialViewer } from './VideoTutorialViewer';
import { Image as ImageIcon, Youtube } from 'lucide-react';

interface Props {
  initialPrompt: string;
  contextType: 'Exercise' | 'Meal';
  currentImageUrl?: string;
  onImageUpdate: (url: string) => void;
}

export const VisualAidManager: React.FC<Props> = ({ 
  initialPrompt, 
  contextType, 
  currentImageUrl, 
  onImageUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'image'
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon size={14} />
          AI Visual
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'video'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Youtube size={14} />
          Tutorials
        </button>
      </div>

      <div className="min-h-[100px]">
        {activeTab === 'image' ? (
          <AIImageEditor 
            initialPrompt={initialPrompt} 
            contextType={contextType} 
            currentImageUrl={currentImageUrl} 
            onImageUpdate={onImageUpdate} 
          />
        ) : (
          <VideoTutorialViewer 
            initialPrompt={`${contextType === 'Exercise' ? 'How to do' : 'Recipe for'} ${initialPrompt}`} 
          />
        )}
      </div>
    </div>
  );
};