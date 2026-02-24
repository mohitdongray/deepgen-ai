import React from 'react';
import { ArrowRight, Play, CheckCircle } from 'lucide-react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content premium-container">
          <div className="hero-badge">
            <span className="badge-text">New Features Available</span>
          </div>

          <h1 className="hero-title">
            Build your AI-powered
            <span className="gradient-text"> video generation</span>
            platform
          </h1>

          <p className="hero-subtitle">
            Create professional AI videos with advanced technology. 
            Generate content that converts with our enterprise-grade platform.
          </p>

          <div className="hero-actions">
            <button className="btn-primary-large">
              Start Free Trial
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large">
              <Play size={20} />
              Watch Demo
            </button>
          </div>

          <div className="hero-features">
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>No credit card required</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>14-day free trial</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={16} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-placeholder">
            <div className="image-content">
              <div className="video-preview">
                <div className="preview-controls">
                  <div className="play-button">
                    <Play size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
