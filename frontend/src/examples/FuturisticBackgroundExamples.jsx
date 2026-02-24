/**
 * Futuristic Background Integration Example
 * 
 * How to integrate the 3D animated background with your website
 * Perfect for hero sections and page backgrounds
 */

import React from 'react';
import FuturisticBackground from '../common/FuturisticBackground/FuturisticBackground';
import { HeroTitle, SectionTitle } from '../common/GradientTitles/GradientTitles';

/**
 * Hero Section with Futuristic Background
 * 
 * Combines the 3D animated background with gradient titles
 * Creates an immersive, professional experience
 */
const HeroSectionWithBackground = () => {
  return (
    <section className="hero-section-with-background">
      {/* Futuristic 3D Background */}
      <FuturisticBackground 
        particleCount={150}
        waveCount={3}
        enabled={true}
      />
      
      {/* Hero Content */}
      <div className="hero-content-layer">
        <div className="hero-container">
          {/* Gradient Title over 3D background */}
          <HeroTitle className="hero-title">
            Windsurf Into the Future
          </HeroTitle>
          
          <p className="hero-subtitle">
            Experience the next generation of AI-powered video generation
            with our cutting-edge windsurf-inspired technology
          </p>
          
          <div className="hero-actions">
            <button className="cta-button">
              Start Creating
            </button>
            <button className="secondary-button">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Full Page with Futuristic Background
 * 
 * Complete page layout with animated background
 * Perfect for landing pages and feature showcases
 */
const FullPageWithBackground = () => {
  return (
    <div className="page-with-futuristic-background">
      {/* Global Background */}
      <FuturisticBackground 
        particleCount={200}
        waveCount={5}
        enabled={true}
      />
      
      {/* Page Content */}
      <div className="page-content-layer">
        {/* Navigation */}
        <nav className="navbar">
          <div className="nav-container">
            <h2 className="nav-logo">DeepGen AI</h2>
            <div className="nav-menu">
              <a href="#home">Home</a>
              <a href="#features">Features</a>
              <a href="#create">Create</a>
              <a href="#explore">Explore</a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <HeroTitle>
              Master the Digital Waves
            </HeroTitle>
            <p className="hero-subtitle">
              Transform your ideas into stunning AI videos with windsurf-inspired motion
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-container">
            <SectionTitle>
              Revolutionary Features
            </SectionTitle>
            <div className="features-grid">
              <div className="feature-card">
                <h3 className="feature-title">Wind-Powered AI</h3>
                <p>Advanced algorithms inspired by wind dynamics</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">Wave Motion</h3>
                <p>Natural, flowing video generation</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">3D Depth</h3>
                <p>Immersive visual experiences</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/**
 * Minimal Background Example
 * 
 * Subtle background with fewer particles
 * Perfect for content-heavy pages
 */
const MinimalBackgroundExample = () => {
  return (
    <div className="minimal-page">
      {/* Subtle Background */}
      <FuturisticBackground 
        particleCount={50}
        waveCount={1}
        enabled={true}
      />
      
      {/* Content */}
      <div className="content-layer">
        <h1 className="page-title">Clean & Professional</h1>
        <p className="page-description">
          Subtle animated background that enhances without distracting
        </p>
      </div>
    </div>
  );
};

/**
 * Performance Optimized Example
 * 
 * Background with performance considerations
 * Good for mobile and lower-end devices
 */
const PerformanceOptimizedExample = () => {
  const [isHighPerformance, setIsHighPerformance] = React.useState(true);
  
  React.useEffect(() => {
    // Detect device performance
    const checkPerformance = () => {
      const connection = navigator.connection;
      const deviceMemory = navigator.deviceMemory;
      const hardwareConcurrency = navigator.hardwareConcurrency;
      
      // Adjust based on device capabilities
      if (deviceMemory && deviceMemory < 4) {
        setIsHighPerformance(false);
      }
      if (hardwareConcurrency && hardwareConcurrency < 4) {
        setIsHighPerformance(false);
      }
      if (connection && connection.effectiveType && 
          connection.effectiveType.includes('2g')) {
        setIsHighPerformance(false);
      }
    };
    
    checkPerformance();
  }, []);

  return (
    <div className="performance-page">
      <FuturisticBackground 
        particleCount={isHighPerformance ? 150 : 50}
        waveCount={isHighPerformance ? 3 : 1}
        enabled={true}
      />
      
      <div className="content-layer">
        <h1 className="page-title">Performance Optimized</h1>
        <p className="page-description">
          Automatically adjusts to device capabilities
        </p>
      </div>
    </div>
  );
};

export {
  HeroSectionWithBackground,
  FullPageWithBackground,
  MinimalBackgroundExample,
  PerformanceOptimizedExample
};

export default HeroSectionWithBackground;
