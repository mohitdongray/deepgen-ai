/**
 * Consent Checkbox Component
 * 
 * Critical ethical component ensuring users confirm they have
 * permission to use the uploaded content. This is a mandatory
 * requirement before any video generation can proceed.
 * 
 * Educational Note: This demonstrates ethical AI usage principles
 * - consent, non-impersonation, and responsible content creation.
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import './ConsentCheckbox.css';

const ConsentCheckbox = ({ checked, onChange, error }) => {
  return (
    <div className={`consent-container ${error ? 'has-error' : ''}`}>
      <label className="consent-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="consent-input"
        />
        <span className="consent-text">
          I confirm that I have explicit permission from all individuals 
          appearing in the uploaded content to use their likeness for 
          AI-generated videos. I understand that impersonation, deepfake 
          fraud, or non-consensual content creation is strictly prohibited 
          and may violate laws.
        </span>
      </label>
      
      {error && (
        <div className="consent-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="consent-info">
        <AlertCircle size={14} />
        <span>
          This platform is for educational and creative purposes only. 
          Generated content must be clearly labeled as AI-generated.
        </span>
      </div>
    </div>
  );
};

export default ConsentCheckbox;
