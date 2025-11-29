import React, { useState } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { Loader2, Wand2, RefreshCw, Image as ImageIcon, Edit, Check } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Enhanced prompt for better results
      const enhancedPrompt = `Photorealistic, high quality, 4k image of ${initialPrompt}. ${contextType === 'Meal' ? 'Food photography, appetizing.' : 'Fitness photography, clear form.'}`;
      const url = await generateImage(enhancedPrompt);
      setImageUrl(url);
      onImageUpdate(url);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!imageUrl || !editPrompt) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const url = await editImage(imageUrl, editPrompt);
      setImageUrl(url);
      onImageUpdate(url);
      setEditPrompt('');
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit failed');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!imageUrl && !isGenerating) {
    return (
      <div className="w-full h-48 bg-slate-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-4">
        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500 mb-3 text-center">No image generated yet</p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md flex items-center"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate AI Image
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
        {isGenerating && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-sm font-medium text-indigo-900">
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
                  className="bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg border border-slate-200 backdrop-blur transition-all"
                  title="Edit Image with Text"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGenerate}
                  className="bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full shadow-lg border border-slate-200 backdrop-blur transition-all"
                  title="Regenerate from scratch"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>
      )}

      {editMode && (
        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            How should Gemini edit this image?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. 'Add a sunset background' or 'Make it sketch style'"
              className="flex-1 text-sm rounded-md border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="text-slate-500 hover:text-slate-700 px-2 py-2"
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