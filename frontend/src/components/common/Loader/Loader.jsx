/**
 * Loader Component
 * 
 * Animated loading indicator for async operations.
 * Used during file uploads and video generation.
 */

import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', text }) => {
  const sizeClass = `loader-${size}`;
  
  return (
    <div className={`loader-container ${sizeClass}`}>
      <div className="loader-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;
