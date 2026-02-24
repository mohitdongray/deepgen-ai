/**
 * Standalone 3D Animation Test - Direct Canvas Implementation
 * 
 * This is a self-contained component that doesn't rely on imports
 * Uses direct canvas rendering to verify 3D animation works
 */

import React, { useEffect, useRef, useState } from 'react';

const Standalone3DTest = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [particleCount, setParticleCount] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    // Set canvas size
    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simple particle class
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + 20; // Start from bottom
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = -Math.random() * 2 - 1; // Move upward
        this.opacity = Math.random() * 0.5 + 0.5;
        this.color = `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${this.opacity})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Reset if out of bounds
        if (this.y < -20 || this.x < -20 || this.x > width + 20) {
          this.reset();
        }
      }

      draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle());

    // Animation loop
    const animate = () => {
      if (!isAnimating) return;

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      // Add some text to show it's working
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '20px Arial';
      ctx.fillText('3D Animation Running - Move Mouse!', 20, 100);
      ctx.fillText(`Particles: ${particleCount}`, 20, 130);

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      animate();
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, particleCount]);

  // Mouse interaction
  const handleMouseMove = (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    particlesRef.current.forEach(particle => {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        particle.speedX += dx * 0.001;
        particle.speedY += dy * 0.001;
      }
    });
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      background: '#000000',
      overflow: 'hidden'
    }}>
      {/* Canvas for 3D animation */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
        onMouseMove={handleMouseMove}
      />

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #6366f1',
        color: '#ffffff',
        minWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#6366f1' }}>
          🎮 Standalone 3D Test
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            style={{
              background: isAnimating ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: 'bold'
            }}
          >
            {isAnimating ? 'STOP' : 'START'} Animation
          </button>

          <button
            onClick={() => setParticleCount(particleCount === 100 ? 200 : 100)}
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
            {particleCount === 100 ? '200' : '100'} Particles
          </button>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            ✅ Status: {isAnimating ? 'RUNNING' : 'STOPPED'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            🎯 Particles: {particleCount}
          </div>
          <div style={{ marginBottom: '10px' }}>
            🖱️ Move mouse to interact
          </div>
        </div>

        {isAnimating && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            ✨ Animation is ACTIVE!
            <br />
            Look for glowing particles floating up
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: '#ffffff',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          🔍 What to Look For:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
          <li>Glowing particles floating upward</li>
          <li>Blue/white colored dots</li>
          <li>Mouse interaction (particles react)</li>
          <li>"3D Animation Running" text</li>
          <li>Particle trails from movement</li>
        </ul>
      </div>
    </div>
  );
};

export default Standalone3DTest;
