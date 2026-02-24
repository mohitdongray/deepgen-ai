/**
 * Section Header Component - Professional UI with Gradient Title
 * 
 * Automatically applies gradient 1 to section headers
 * Uses modern design with proper hierarchy and responsive layout
 */

import React from 'react';
import '../styles/gradient-titles.css';

const SectionHeader = ({ 
  title, 
  subtitle, 
  description, 
  className = '', 
  centered = false,
  ...props 
}) => {
  return (
    <div 
      className={`section-header ${centered ? 'section-header--centered' : ''} ${className}`}
      {...props}
    >
      {/* Section Title - Automatic Gradient 1 Application */}
      <h1 className="section-header__title title-gradient-full">
        {title}
      </h1>
      
      {/* Optional Subtitle */}
      {subtitle && (
        <h2 className="section-header__subtitle">
          {subtitle}
        </h2>
      )}
      
      {/* Optional Description */}
      {description && (
        <p className="section-header__description">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
