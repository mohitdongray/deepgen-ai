/**
 * Application Entry Point
 * 
 * Renders the React application into the DOM.
 * This is the standard Create React App entry file.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root and render App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
