/**
 * Cursor Effect Component - Canvas-based Minimal Particle Trail
 * 
 * Creates a subtle, Sora AI-inspired cursor effect using HTML5 Canvas
 * Features: minimal particles, smooth movement, purple theme integration
 * Performance optimized with requestAnimationFrame and GPU acceleration
 * 
 * @component
 * @example
 * // In App.js - render once at top level
 * <CursorEffect />
 */

import React, { useEffect, useRef, useState } from 'react';
import './CursorEffect.css';

const CursorEffect = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const lastSpawnTime = useRef(0);
  const animationFrameId = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Particle class for clean object-oriented approach
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 2 + Math.random() * 2; // 2-4px radius
      this.speedX = (Math.random() - 0.5) * 0.5; // Gentle horizontal drift
      this.speedY = (Math.random() - 0.5) * 0.5; // Gentle vertical drift
      this.life = 1.0; // Full life at creation
      this.decay = 0.01 + Math.random() * 0.01; // 0.01-0.02 decay rate
      this.color = this.generatePurpleColor(); // Theme-matching color
    }

    /**
     * Generates purple-themed colors matching DeepGen AI brand
     * @returns {string} RGBA color string
     */
    generatePurpleColor() {
      const purpleVariants = [
        'rgba(139, 92, 246, 0.15)', // Soft purple
        'rgba(99, 102, 241, 0.12)',  // Indigo
        'rgba(167, 139, 250, 0.1)'   // Light purple
      ];
      return purpleVariants[Math.floor(Math.random() * purpleVariants.length)];
    }

    /**
     * Updates particle position and life
     * Particle gradually fades and drifts
     */
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
    }

    /**
     * Draws particle on canvas with glow effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    draw(ctx) {
      ctx.save();
      
      // Main particle with soft edges
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle glow effect
      ctx.globalAlpha = this.life * 0.3;
      ctx.fillStyle = this.color.replace(/[\d.]+\)$/, '0.05)');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    /**
     * Checks if particle is still alive
     * @returns {boolean} True if particle should remain active
     */
    isAlive() {
      return this.life > 0;
    }
  }

  /**
   * Linear interpolation for smooth mouse movement
   * @param {number} start - Starting value
   * @param {number} end - Target value  
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
  const lerp = (start, end, factor) => start + (end - start) * factor;

  /**
   * Handles mouse movement and spawns particles
     * @param {MouseEvent} e - Mouse event object
   */
  const handleMouseMove = (e) => {
    const currentTime = Date.now();
    
    // Throttle particle spawning (30fps for subtlety)
    if (currentTime - lastSpawnTime.current < 32) {
      return;
    }
    
    lastSpawnTime.current = currentTime;
    
    // Smooth mouse position with linear interpolation
    mousePosition.current.x = lerp(mousePosition.current.x, e.clientX, 0.3);
    mousePosition.current.y = lerp(mousePosition.current.y, e.clientY, 0.3);

    // Generate 2-5 small particles per movement
    const particleCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < particleCount; i++) {
      // Small random offset for natural spread
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      
      particlesRef.current.push(
        new Particle(
          mousePosition.current.x + offsetX, 
          mousePosition.current.y + offsetY
        )
      );
    }

    // Limit particles to prevent performance issues
    if (particlesRef.current.length > 15) {
      particlesRef.current = particlesRef.current.slice(-15);
    }
  };

  /**
   * Main animation loop using requestAnimationFrame
   * Updates and renders all particles
   */
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas for fresh frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.update();
      
      if (particle.isAlive()) {
        particle.draw(ctx);
        return true; // Keep alive particles
      }
      return false; // Remove dead particles
    });
    
    animationFrameId.current = requestAnimationFrame(animate);
  };

  /**
   * Handles window resize to maintain canvas coverage
   */
  const handleResize = () => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  useEffect(() => {
    // Skip effect on mobile devices for performance
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    if (isMobile) return;

    // Set initial canvas dimensions
    handleResize();

    // Start animation loop
    animationFrameId.current = requestAnimationFrame(animate);

    // Event listeners
    document.body.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      document.body.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Update canvas size when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-effect-canvas"
      width={dimensions.width}
      height={dimensions.height}
    />
  );
};

export default CursorEffect;
