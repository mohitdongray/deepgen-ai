/**
 * Futuristic 3D Animated Background Scene - WORKING VERSION
 * 
 * Based on the successful standalone test
 * Windsurf-inspired particle system with smooth floating motion
 */

import React, { useEffect, useRef, useState } from 'react';
import './FuturisticBackground-fixed.css';

const FuturisticBackground = ({ 
  className = '',
  particleCount = 150,
  waveCount = 3,
  enabled = true,
  navbarHeight = 60,
  ...props 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const wavesRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;

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

    // Enhanced Particle class - Based on working standalone version
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * (height - navbarHeight) + navbarHeight;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * (height - navbarHeight) + navbarHeight; // Start below navbar
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = -Math.random() * 2 - 1; // Move upward
        this.opacity = Math.random() * 0.5 + 0.5;
        this.trail = [];
        this.maxTrailLength = Math.floor(Math.random() * 15 + 10);
        this.life = 1;
        this.decay = Math.random() * 0.002 + 0.001;
        
        // Enhanced color system
        const colorType = Math.random();
        if (colorType < 0.33) {
          this.color = `rgba(255, 255, 255, ${this.opacity})`; // White
        } else if (colorType < 0.66) {
          this.color = `rgba(99, 102, 241, ${this.opacity})`; // Blue
        } else {
          this.color = `rgba(139, 92, 246, ${this.opacity})`; // Purple
        }
      }

      update() {
        // Windsurf-inspired flowing motion
        const windEffect = Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.3;
        const waveEffect = Math.cos(Date.now() * 0.0008 + this.y * 0.01) * 0.2;
        
        // Update position with wind and wave effects
        this.x += this.speedX + windEffect;
        this.y += this.speedY + waveEffect;

        // Add to trail
        this.trail.push({ x: this.x, y: this.y, color: this.color, opacity: this.opacity });
        if (this.trail.length > this.maxTrailLength) {
          this.trail.shift();
        }

        // Life decay
        this.life -= this.decay;

        // Reset particle if out of bounds or dead
        if (this.y < navbarHeight || this.x < -20 || this.x > width + 20 || this.life <= 0) {
          this.reset();
        }
      }

      draw(ctx) {
        // Draw trail
        if (this.trail.length > 1) {
          this.trail.forEach((point, index) => {
            const trailOpacity = (index / this.trail.length) * this.opacity * this.life * 0.3;
            ctx.fillStyle = point.color.replace(/[\d.]+\)$/, `${trailOpacity})`);
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        // Draw particle with glow
        ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.opacity * this.life})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Enhanced glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Wave class for abstract wave shapes
    class Wave {
      constructor(index) {
        this.index = index;
        this.reset();
      }

      reset() {
        this.amplitude = Math.random() * 30 + 20;
        this.frequency = Math.random() * 0.02 + 0.01;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.002 + 0.001;
        this.y = navbarHeight + (this.index * (height - navbarHeight) * 0.25);
        this.opacity = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.phase += this.speed;
      }

      draw(ctx) {
        ctx.strokeStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();

        for (let x = 0; x <= width; x += 5) {
          const y = this.y + Math.sin(x * this.frequency + this.phase) * this.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
    }

    // Initialize particles and waves
    particlesRef.current = Array.from({ length: particleCount }, () => new Particle());
    wavesRef.current = Array.from({ length: waveCount }, (_, i) => new Wave(i));

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

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop - Based on working standalone version
    const animate = () => {
      // Clear canvas with fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Set clipping region to exclude navbar area
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, navbarHeight, width, height - navbarHeight);
      ctx.clip();

      // Update and draw waves
      wavesRef.current.forEach(wave => {
        wave.update();
        wave.draw(ctx);
      });

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });

      // Restore clipping region
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, particleCount, waveCount, navbarHeight]);

  return (
    <div className={`futuristic-background ${className}`} {...props}>
      <canvas
        ref={canvasRef}
        className="futuristic-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1, // BEHIND all content
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease',
          pointerEvents: 'none' // Don't interfere with mouse events
        }}
      />
    </div>
  );
};

export default FuturisticBackground;
