/**
 * Reusable Card Component - Professional UI with Gradient Title
 * 
 * Automatically applies gradient 2 to card titles
 * Uses modern design with shadows, hover effects, and responsive layout
 */

import React from 'react';
import '../styles/gradient-titles.css';

const Card = ({ 
  title, 
  description, 
  icon, 
  image, 
  className = '', 
  onClick,
  children,
  ...props 
}) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Card Media/Icon Section */}
      {(icon || image) && (
        <div className="card-media">
          {icon && <div className="card-icon">{icon}</div>}
          {image && <img src={image} alt={title} className="card-image" />}
        </div>
      )}
      
      {/* Card Content Section */}
      <div className="card-content">
        {/* Card Title - Automatic Gradient 2 Application */}
        <h3 className="card-title title-gradient-partial">
          {title}
        </h3>
        
        {/* Card Description */}
        <p className="card-description">
          {description}
        </p>
        
        {/* Additional Content */}
        {children}
      </div>
    </div>
  );
};

export default Card;
