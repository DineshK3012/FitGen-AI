import React, { useState, useCallback, useEffect } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { Loader2, Wand2, RefreshCw, Image as ImageIcon, Edit, Check } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { toast } from 'sonner';

interface Props {
  initialPrompt: string;
  contextType: 'Exercise' | 'Meal';
  currentImageUrl?: string;
  onImageUpdate: (url: string) => void;
}

export const AIImageEditor: React.FC<Props> = ({ initialPrompt, contextType, currentImageUrl, onImageUpdate }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentImageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  // Rate limit: 5 requests per minute for images
  const { checkLimit } = useRateLimit('image_gen', { limit: 5, interval: 60000 });

  const handleGenerate = useCallback(async () => {
    if (!checkLimit()) return;

    setIsGenerating(true);
    const toastId = toast.loading('Generating image with Gemini Nano...');
    
    try {
      // Enhanced prompt for better results
      const enhancedPrompt = `Photorealistic, high quality, 4k image of ${initialPrompt}. ${contextType === 'Meal' ? 'Food photography, appetizing.' : 'Fitness photography, clear form.'}`;
      const url = await generateImage(enhancedPrompt);
      setImageUrl(url);
      onImageUpdate(url);
      setEditMode(false);
      toast.success('Image generated successfully!', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }, [initialPrompt, contextType, onImageUpdate, checkLimit]);

  const handleEdit = useCallback(async () => {
    if (!imageUrl || !editPrompt) return;
    if (!checkLimit()) return;
    
    setIsGenerating(true);
    const toastId = toast.loading('Editing image...');
    
    try {
      const url = await editImage(imageUrl, editPrompt);
      setImageUrl(url);
      onImageUpdate(url);
      setEditPrompt('');
      setEditMode(false);
      toast.success('Image edited successfully!', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Edit failed', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }, [imageUrl, editPrompt, onImageUpdate, checkLimit]);

  if (!imageUrl && !isGenerating) {
    return (
      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 transition-colors">
        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center">No image generated yet</p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md flex items-center shadow-sm"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate AI Image
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {isGenerating && (
          <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
              {editPrompt ? 'Editing with Gemini...' : 'Generating...'}
            </span>
          </div>
        )}
        
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="AI Generated" 
            className="w-full h-64 object-cover"
          />
        )}
        
        {/* Floating Controls */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
            {!editMode && (
              <>
                 <button
                  onClick={() => setEditMode(true)}
                  className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur transition-all"
                  title="Edit Image with Text"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGenerate}
                  className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur transition-all"
                  title="Regenerate from scratch"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
        </div>
      </div>

      {editMode && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            How should Gemini edit this image?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. 'Add a sunset background'"
              className="flex-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditMode(false); setEditPrompt(''); }}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-2"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Powered by Gemini 2.5 Flash Image. Describe the change you want to see.
          </p>
        </div>
      )}
    </div>
  );
};