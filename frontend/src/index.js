/**
 * Application Entry Point
 * 
 * Renders the React application into the DOM.
 * This is the standard Create React App entry file.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
// ── Global design system (tokens, base, utility classes) ──
import './styles/design-system.css';
import App from './App';

// Suppress benign ResizeObserver errors in development
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalError(...args);
};
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
  }
});

// Create root and render App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
