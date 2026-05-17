/**
 * Dashboard Layout Component
 * 
 * Main layout wrapper providing consistent structure:
 * - Top navigation bar
 * - Main content area
 * - Conditional AI prompt bar for creation pages
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import DeepGenNavbar from '../../common/ModernNavbar/ModernNavbar';
import Footer from '../../common/Footer/Footer';
import './DashboardLayout.css';

const AIPromptBar = () => (
  <div className="ai-prompt-bar">
    <input
      type="text"
      className="ai-prompt-input"
      placeholder="Describe your desired output style, appearance, or tone..."
    />
    <button className="ai-prompt-submit">
      →
    </button>
  </div>
);

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  
  // Routes where AI prompt bar should appear
  const creationRoutes = ['/workspace', '/video', '/image', '/voice', '/generate'];
  const showPromptBar = creationRoutes.includes(location.pathname);

  return (
    <div className="dashboard-layout">
      <div className="navbar-wrapper">
        <DeepGenNavbar />
      </div>
      <main className="dashboard-main">
        {children}
      </main>
      {showPromptBar && <AIPromptBar />}
      <Footer />
    </div>
  );
};

export default DashboardLayout;
