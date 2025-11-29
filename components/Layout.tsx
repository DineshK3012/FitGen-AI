import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <div className="print:hidden">
         <Footer />
      </div>
    </div>
  );
};