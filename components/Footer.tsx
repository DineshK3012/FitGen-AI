import React from 'react';
import { Dumbbell, Heart, Github, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 dark:text-white">FitGen<span className="text-indigo-600">AI</span></span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
              Advanced AI-powered fitness planning with next-gen image generation. Your personal coach, nutritionist, and artist in one app.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Github size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/create" className="hover:text-indigo-600 transition-colors">Generate Plan</Link></li>
              <li><Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} FitGenAI. All rights reserved.</p>
          <div className="flex items-center mt-4 md:mt-0">
            <span>Made with</span>
            <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" />
            <span>using Gemini API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};