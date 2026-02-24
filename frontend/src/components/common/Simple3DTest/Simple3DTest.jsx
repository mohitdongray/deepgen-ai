/**
 * Simple 3D Test Component - Immediate Visual Verification
 * 
 * This will show you if the 3D animation is working
 * Add this to any page to test immediately
 */

import React, { useState } from 'react';
import FuturisticBackground from '../FuturisticBackground/FuturisticBackground';

const Simple3DTest = () => {
  const [showBackground, setShowBackground] = useState(true);
  const [testMode, setTestMode] = useState('full');

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      background: '#000000',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 3D Background Test */}
      {showBackground && (
        <FuturisticBackground 
          particleCount={testMode === 'minimal' ? 50 : 200}
          waveCount={testMode === 'minimal' ? 1 : 3}
          enabled={true}
          navbarHeight={60} // Match your navbar height
        />
      )}

      {/* Test Controls */}
      <div style={{
        position: 'fixed',
        top: '80px', // Below navbar
        left: '20px',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #6366f1',
        color: '#ffffff',
        minWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#6366f1' }}>
          🎮 3D Animation Test
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => setShowBackground(!showBackground)}
            style={{
              background: showBackground ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: 'bold'
            }}
          >
            {showBackground ? 'HIDE' : 'SHOW'} 3D
          </button>

          <button
            onClick={() => setTestMode(testMode === 'full' ? 'minimal' : 'full')}
            style={{
              background: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {testMode === 'full' ? 'MINIMAL' : 'FULL'}
          </button>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            ✅ What to Look For:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Small glowing particles floating up</li>
            <li>Wave patterns in background</li>
            <li>Neon colors (white → blue → purple)</li>
            <li>Mouse parallax effect</li>
            <li>Light streaks occasionally</li>
            <li>Nothing behind navbar (top 60px)</li>
          </ul>
        </div>

        {showBackground && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: 'rgba(99, 102, 241, 0.2)',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            ✨ Animation is RUNNING
            <br />
            Particles: {testMode === 'full' ? 200 : 50}
            <br />
            Waves: {testMode === 'full' ? 3 : 1}
          </div>
        )}
      </div>

      {/* Test Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        padding: '120px 20px 20px',
        textAlign: 'center',
        color: '#ffffff'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          3D Animation Test Page
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '40px', opacity: 0.8 }}>
          Move your mouse around to see the parallax effect!
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>
              3D Particles
            </h3>
            <p style={{ opacity: 0.8 }}>
              Floating particles with depth perception and motion trails
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>
              Wind Motion
            </h3>
            <p style={{ opacity: 0.8 }}>
              Natural flowing movement inspired by windsurf dynamics
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>
              Mouse Parallax
            </h3>
            <p style={{ opacity: 0.8 }}>
              Interactive depth response to cursor movement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simple3DTest;
