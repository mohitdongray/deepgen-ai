/**
 * Windsurf Title Generator - Dynamic Title Text Component
 * 
 * Generates engaging, visually appealing windsurf-themed titles
 * Perfect for cards, hero sections, and feature highlights
 * Automatically applies gradient styling
 */

import React, { useState, useEffect } from 'react';
import { SectionTitle, CardTitle, FeatureTitle } from '../GradientTitles/GradientTitles';

const WindsurfTitleGenerator = ({ 
  type = 'feature', // 'hero', 'section', 'card', 'feature'
  className = '',
  animated = true,
  ...props 
}) => {
  // Windsurf-themed title pools
  const titlePools = {
    hero: [
      'Master the Waves',
      'Conquer the Ocean',
      'Windsurf Like a Pro',
      'Ride the Wind',
      'Ocean Adventures',
      'Ultimate Windsurf Experience',
      'Feel the Power of Wind',
      'Windsurf Paradise'
    ],
    section: [
      'Windsurf Adventures',
      'Top Windsurf Spots',
      'Learn Windsurfing Today',
      'Professional Windsurfing',
      'Windsurf Equipment Guide',
      'Best Windsurf Locations',
      'Windsurf Training Programs',
      'Advanced Windsurf Techniques'
    ],
    card: [
      'Windsurf Mastery',
      'Ocean Windsurf',
      'Wind Riding',
      'Wave Surfing',
      'Sail & Surf',
      'Coastal Windsurf',
      'Extreme Windsurf',
      'Windsurf Explorer'
    ],
    feature: [
      'Windsurf Pro',
      'Wind Power',
      'Wave Control',
      'Sail Speed',
      'Ocean Glide',
      'Wind Rush',
      'Surf Master',
      'Aerial Windsurf'
    ]
  };

  // Dynamic title states
  const [currentTitle, setCurrentTitle] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Get initial title
  useEffect(() => {
    const pool = titlePools[type] || titlePools.feature;
    const randomTitle = pool[Math.floor(Math.random() * pool.length)];
    setCurrentTitle(randomTitle);
  }, [type]);

  // Animate title changes if enabled
  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        const pool = titlePools[type] || titlePools.feature;
        const randomTitle = pool[Math.floor(Math.random() * pool.length)];
        setCurrentTitle(randomTitle);
        setIsAnimating(false);
      }, 300);
    }, 5000); // Change title every 5 seconds

    return () => clearInterval(interval);
  }, [type, animated]);

  // Render appropriate component based on type
  const renderTitle = () => {
    const titleClasses = [
      className,
      animated && 'windsurf-title-animated',
      isAnimating && 'windsurf-title-animating'
    ].filter(Boolean).join(' ');

    switch (type) {
      case 'hero':
        return (
          <h1 className={`headline-line reveal visible ${titleClasses}`} {...props}>
            {currentTitle}
          </h1>
        );
      
      case 'section':
        return (
          <SectionTitle className={`reveal visible ${titleClasses}`} {...props}>
            {currentTitle}
          </SectionTitle>
        );
      
      case 'card':
        return (
          <CardTitle className={`reveal visible ${titleClasses}`} {...props}>
            {currentTitle}
          </CardTitle>
        );
      
      case 'feature':
      default:
        return (
          <FeatureTitle className={`reveal visible ${titleClasses}`} {...props}>
            {currentTitle}
          </FeatureTitle>
        );
    }
  };

  return renderTitle();
};

/**
 * Pre-configured Windsurf Title Components
 */

// Hero Title - Full gradient for main sections
export const WindsurfHeroTitle = (props) => (
  <WindsurfTitleGenerator type="hero" {...props} />
);

// Section Title - Full gradient for sections
export const WindsurfSectionTitle = (props) => (
  <WindsurfTitleGenerator type="section" {...props} />
);

// Card Title - Partial gradient for cards
export const WindsurfCardTitle = (props) => (
  <WindsurfTitleGenerator type="card" {...props} />
);

// Feature Title - Partial gradient for features
export const WindsurfFeatureTitle = (props) => (
  <WindsurfTitleGenerator type="feature" {...props} />
);

/**
 * Static Windsurf Titles - Non-animated versions
 */

// Static hero titles with full gradient
export const StaticWindsurfHero = ({ children, ...props }) => (
  <h1 className="headline-line reveal visible title-gradient-full" {...props}>
    {children}
  </h1>
);

// Static feature titles with partial gradient
export const StaticWindsurfFeature = ({ children, ...props }) => (
  <h3 className="feature-title reveal visible title-gradient-partial" {...props}>
    {children}
  </h3>
);

export default WindsurfTitleGenerator;
