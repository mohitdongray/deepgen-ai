/**
 * Cursor Aura Component - Minimal AI SaaS Effect
 * 
 * Creates a subtle cursor trail with minimal particles
 * Features: smooth movement, quick fade, theme-matching colors
 * Performance optimized with GPU acceleration
 */

import React, { useEffect, useRef, useState } from 'react';
import './CursorAura.css';

const CursorAura = () => {
  const [particles, setParticles] = useState([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const lastSpawnTime = useRef(0);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // Check if mobile device
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    if (isMobile) {
      return; // Skip aura on mobile for performance
    }

    // Linear interpolation helper
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      
      // Throttle particle spawning (max 30fps for subtlety)
      if (currentTime - lastSpawnTime.current < 32) {
        return;
      }
      
      lastSpawnTime.current = currentTime;
      
      // Smooth mouse position with lerp
      mousePosition.current.x = lerp(mousePosition.current.x, e.clientX, 0.3);
      mousePosition.current.y = lerp(mousePosition.current.y, e.clientY, 0.3);

      // Generate 2-5 small particles per move
      const particleCount = Math.floor(Math.random() * 4) + 2; // 2-5 particles
      
      const newParticles = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: `particle-${currentTime}-${Math.random()}-${i}`,
          x: mousePosition.current.x + (Math.random() - 0.5) * 8, // Small offset
          y: mousePosition.current.y + (Math.random() - 0.5) * 8,
          scale: 0.2 + Math.random() * 0.3, // 0.2 - 0.5 scale (2-4px radius)
          opacity: 0.1 + Math.random() * 0.1, // 0.1 - 0.2 opacity
          lifetime: 400 + Math.random() * 400, // 0.4s - 0.8s lifetime
          createdAt: currentTime
        });
      }

      setParticles(prev => {
        // Keep only particles within lifetime
        const filtered = prev.filter(particle => {
          const age = currentTime - particle.createdAt;
          return age < particle.lifetime;
        });
        
        // Limit to max 15 particles
        const combined = [...filtered, ...newParticles];
        return combined.length > 15 ? combined.slice(-15) : combined;
      });
    };

    // Smooth animation loop
    const animate = () => {
      const currentTime = Date.now();
      
      setParticles(prev => prev.map(particle => {
        const age = currentTime - particle.createdAt;
        const progress = age / particle.lifetime;
        
        if (progress >= 1) {
          return null; // Mark for removal
        }
        
        // Smooth fade out with linear easing
        const easeOut = 1 - progress;
        
        return {
          ...particle,
          scale: particle.scale * (1 - progress * 0.2), // Slight scale reduction
          opacity: particle.opacity * easeOut,
          // Very gentle drift
          x: particle.x + Math.sin(age * 0.002) * 0.3,
          y: particle.y + Math.cos(age * 0.002) * 0.3
        };
      }).filter(Boolean));
      
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Attach listener to document.body for maximum coverage
    document.body.addEventListener('mousemove', handleMouseMove);
    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      document.body.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="cursor-aura-container">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="cursor-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `translate(-50%, -50%) scale(${particle.scale})`,
            opacity: particle.opacity
          }}
        />
      ))}
    </div>
  );
};

export default CursorAura;
