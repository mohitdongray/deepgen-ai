/**
 * Live 3D Animation Demo Page
 * 
 * This page demonstrates the futuristic 3D background in action
 * You can copy this code to see the animation working immediately
 */

import React, { useState, useEffect } from 'react';
import FuturisticBackground from '../components/common/FuturisticBackground/FuturisticBackground';
import { HeroTitle, SectionTitle } from '../components/common/GradientTitles/GradientTitles';

const Live3DDemo = () => {
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(true);
  const [particleCount, setParticleCount] = useState(150);
  const [waveCount, setWaveCount] = useState(3);
  const [fps, setFps] = useState(0);

  // FPS counter for performance monitoring
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    if (isBackgroundEnabled) {
      requestAnimationFrame(measureFPS);
    }
  }, [isBackgroundEnabled]);

  return (
    <div className="demo-page">
      {/* 3D Background - This is where the magic happens! */}
      {isBackgroundEnabled && (
        <FuturisticBackground 
          particleCount={particleCount}
          waveCount={waveCount}
          enabled={isBackgroundEnabled}
        />
      )}

      {/* Control Panel */}
      <div className="control-panel">
        <div className="control-card">
          <h3 className="control-title">3D Animation Controls</h3>
          
          <div className="control-group">
            <label className="control-label">
              <input
                type="checkbox"
                checked={isBackgroundEnabled}
                onChange={(e) => setIsBackgroundEnabled(e.target.checked)}
              />
              Enable 3D Animation
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">
              Particles: {particleCount}
              <input
                type="range"
                min="10"
                max="300"
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                disabled={!isBackgroundEnabled}
              />
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">
              Waves: {waveCount}
              <input
                type="range"
                min="0"
                max="10"
                value={waveCount}
                onChange={(e) => setWaveCount(Number(e.target.value))}
                disabled={!isBackgroundEnabled}
              />
            </label>
          </div>

          <div className="fps-counter">
            FPS: {fps}
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="demo-content">
        <div className="hero-section">
          <HeroTitle>
            3D Animation Demo
          </HeroTitle>
          <p className="demo-description">
            Move your mouse around to see the parallax effect!
            The particles should be floating and flowing like wind.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">3D Particles</h3>
            <p>Glowing particles with depth perception and motion trails</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Wind Motion</h3>
            <p>Natural flowing movement inspired by windsurf dynamics</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Mouse Parallax</h3>
            <p>Interactive depth response to cursor movement</p>
          </div>
        </div>

        <div className="instructions">
          <h3 className="instructions-title">What to Look For:</h3>
          <ul className="instructions-list">
            <li>✨ Small glowing particles floating upward</li>
            <li>🌊 Subtle wave patterns in the background</li>
            <li>🎨 Neon gradient colors (white → blue → purple)</li>
            <li>🖱️ Mouse movement should create parallax effect</li>
            <li>💫 Occasional light streaks across the screen</li>
            <li>🌟 Particle trails that fade gradually</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .demo-page {
          position: relative;
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          overflow-x: hidden;
        }

        .control-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        .control-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          min-width: 250px;
        }

        .control-title {
          color: #ffffff;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .control-label input[type="range"] {
          flex: 1;
          margin-left: 10px;
        }

        .fps-counter {
          background: rgba(99, 102, 241, 0.2);
          padding: 8px 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.9rem;
          color: #6366f1;
        }

        .demo-content {
          position: relative;
          z-index: 10;
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 60px;
        }

        .demo-description {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 20px auto;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 30px;
          backdrop-filter: blur(10px);
        }

        .feature-title {
          color: #ffffff;
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .instructions {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 30px;
          backdrop-filter: blur(10px);
        }

        .instructions-title {
          color: #ffffff;
          margin-bottom: 20px;
          font-size: 1.3rem;
        }

        .instructions-list {
          list-style: none;
          padding: 0;
        }

        .instructions-list li {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 10px;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .control-panel {
            position: relative;
            top: auto;
            right: auto;
            margin: 20px;
          }

          .demo-content {
            padding: 40px 20px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Live3DDemo;
