import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Dumbbell } from 'lucide-react';
import { useTheme } from '../services/themeContext';

export const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Create Plan', path: '/create' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              FitGen<span className="text-indigo-600">AI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 absolute w-full left-0">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-lg">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};