import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './services/themeContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { CreatePlan } from './pages/CreatePlan';
import { PlanViewer } from './pages/PlanViewer';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreatePlan />} />
            <Route path="/plan/:id" element={<PlanViewer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;