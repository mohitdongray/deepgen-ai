/**
 * Main Application Component
 * 
 * Root component that sets up:
 * - React Router for navigation
 * - Theme and Auth context providers
 * - Route definitions for all pages
 * 
 * Architecture note: This is the entry point for the SPA. All pages are
 * lazy-loaded where possible, but for this educational project we use
 * direct imports for clarity.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GenerationProvider } from './context/GenerationContext';
import DashboardLayout from './components/layout/DashboardLayout/DashboardLayout';
import Home from './pages/Home/Home';
import Create from './pages/Create/Create';
import Studio from './pages/Studio/Studio';
import Upload from './pages/Upload/Upload';
import Generate from './pages/Generate/Generate';
import Preview from './pages/Preview/Preview';
import ExploreFeatures from './pages/ExploreFeatures/ExploreFeatures';
import ArchitecturePage from './pages/Architecture/ArchitecturePage';
import CursorEffect from './components/features/CursorEffect/CursorEffect';
import FuturisticBackground from './components/common/FuturisticBackground/FuturisticBackground';
import ScrollToTop from './components/common/ScrollToTop/ScrollToTop';
import './components/common/Card/Card-alignment.css';
import { useLocation } from 'react-router-dom';

const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <>
      <ScrollToTop />
      {/* Background Animation - Fixed position, behind everything */}
      <FuturisticBackground particleCount={150} waveCount={3} enabled={true} navbarHeight={60} />
      
      {/* Content Wrapper - All content goes here */}
      <div className="content-wrapper">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardLayout><Home /></DashboardLayout>} />
          <Route path="/create" element={<DashboardLayout><Create /></DashboardLayout>} />
          <Route path="/studio" element={<DashboardLayout><Studio /></DashboardLayout>} />
          <Route path="/workspace" element={<DashboardLayout><Upload /></DashboardLayout>} />
          <Route path="/generate" element={<DashboardLayout><Generate /></DashboardLayout>} />
          <Route path="/preview/:jobId" element={<DashboardLayout><Preview /></DashboardLayout>} />
          <Route path="/explore-features" element={<DashboardLayout><ExploreFeatures /></DashboardLayout>} />
          <Route path="/architecture" element={<DashboardLayout><ArchitecturePage /></DashboardLayout>} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GenerationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </GenerationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
