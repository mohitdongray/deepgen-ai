/**
 * Global Scroll Animation System
 * 
 * Reusable IntersectionObserver for smooth reveal animations
 * Supports re-triggering on scroll for persistent motion feedback
 */

// Animation configuration
const ANIMATION_CONFIG = {
  threshold: 0.18,
  rootMargin: '0px 0px -50px 0px',
  duration: 900,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
};

// CSS for animation states
const ANIMATION_STYLES = `
  .reveal {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
    filter: blur(6px);
    transition: all ${ANIMATION_CONFIG.duration}ms ${ANIMATION_CONFIG.easing};
  }
  
  .reveal.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  
  /* Staggered delays */
  .reveal.stagger-1 { transition-delay: 100ms; }
  .reveal.stagger-2 { transition-delay: 200ms; }
  .reveal.stagger-3 { transition-delay: 300ms; }
  .reveal.stagger-4 { transition-delay: 400ms; }
  .reveal.stagger-5 { transition-delay: 500ms; }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = ANIMATION_STYLES;
document.head.appendChild(styleSheet);

// IntersectionObserver instance with re-triggering support
let observer;

export const initScrollAnimations = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, {
    threshold: ANIMATION_CONFIG.threshold,
    rootMargin: ANIMATION_CONFIG.rootMargin
  });

  // Observe all elements with reveal class
  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });
};

export const addRevealClass = (element, staggerDelay = 0) => {
  if (element) {
    element.classList.add('reveal');
    if (staggerDelay > 0) {
      element.classList.add(`stagger-${staggerDelay}`);
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}
