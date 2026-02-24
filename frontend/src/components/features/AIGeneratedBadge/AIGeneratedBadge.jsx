/**
 * AI Generated Badge Component
 * 
 * Displays a visible label indicating content was AI-generated.
 * Required for transparency and ethical AI usage.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import './AIGeneratedBadge.css';

const AIGeneratedBadge = () => {
  return (
    <div className="ai-badge">
      <Sparkles size={14} />
      <span>AI-Generated</span>
    </div>
  );
};

export default AIGeneratedBadge;
