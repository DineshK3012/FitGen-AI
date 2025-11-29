import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ArrowLeft, Key, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const key = storageService.getApiKey();
    if (key) setApiKey(key);
  }, []);

  const handleSave = () => {
    storageService.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
            <Key className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        </div>

        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Gemini API Key Required</p>
            <p>To generate customized fitness plans and edit images, you need a Google Gemini API key. The key is stored locally on your device.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Google Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              placeholder="AIzaSy..."
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              saved 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saved ? (
              <>Saved Successfully</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save API Key
              </>
            )}
          </button>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
            Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-600 dark:hover:text-indigo-400">Google AI Studio</a>
          </p>
        </div>
      </div>
    </div>
  );
};