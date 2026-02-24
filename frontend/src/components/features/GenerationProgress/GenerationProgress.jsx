/**
 * Generation Progress Component
 * 
 * Shows real-time progress of video generation with:
 * - Status indicator (pending/processing/completed)
 * - Estimated time remaining
 * - Visual progress bar
 */

import React from 'react';
import { Clock, CheckCircle, Loader } from 'lucide-react';
import './GenerationProgress.css';

const GenerationProgress = ({ status, pollCount, estimatedTime }) => {
  // Calculate rough progress percentage based on polls
  // External AI APIs typically take 1-3 minutes
  const progressPercent = Math.min((pollCount / estimatedTime) * 100, 95);

  return (
    <div className="generation-progress">
      <div className="progress-status">
        {status === 'pending' && (
          <>
            <Clock size={20} />
            <span>Queued for processing...</span>
          </>
        )}
        {status === 'processing' && (
          <>
            <Loader size={20} className="spinning" />
            <span>Generating your video...</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <CheckCircle size={20} className="success" />
            <span>Generation complete!</span>
          </>
        )}
      </div>

      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="progress-details">
        <span>Status: {status}</span>
        <span>{Math.round(progressPercent)}% complete</span>
      </div>

      <p className="progress-note">
        This process uses external AI services and typically takes 1-3 minutes.
        Please do not close this window.
      </p>
    </div>
  );
};

export default GenerationProgress;
