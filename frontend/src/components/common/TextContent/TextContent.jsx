/**
 * Reusable Text Content Component
 * 
 * Handles title, description, and CTA for feature cards
 * - AI accent highlighting in titles
 * - Staggered reveal animations
 * - Responsive typography
 * - Consistent spacing and styling
 */

import React from 'react';

const TextContent = ({ 
  title, 
  description, 
  onGetStarted, 
  staggerDelay = 0 
}) => {
  return (
    <div className="feature-content">
      {/* Title with AI accent highlighting */}
      <h3 className="feature-title reveal" style={{ animationDelay: `${staggerDelay + 0.2}s` }}>
        {title.includes('AI') ? (
          <>
            {title.split('AI')[0]}
            <span className="ai-accent">AI</span>
            {title.split('AI')[1]}
          </>
        ) : title}
      </h3>
      
      {/* Description with muted gray color */}
      <p className="feature-description reveal" style={{ animationDelay: `${staggerDelay + 0.3}s` }}>
        {description}
      </p>
      
      {/* CTA button with gradient background */}
      <button 
        className="feature-cta reveal" 
        style={{ animationDelay: `${staggerDelay + 0.4}s` }}
        onClick={() => onGetStarted?.(title.toLowerCase().replace(/\s+/g, '-'))}
      >
        Get started for free
      </button>
    </div>
  );
};

export default TextContent;
