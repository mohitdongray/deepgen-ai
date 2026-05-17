/**
 * Home Page
 * 
 * Landing page with:
 * - Hero section with call-to-action
 * - Feature highlights
 * - Stats/trust indicators
 * - Navigation to upload
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Zap, Shield, Globe, Users, Camera, Mic, Film, Layers } from 'lucide-react';
import { addRevealClass, initScrollAnimations } from '../../styles/animations.js';
import { HeroTitle, SectionTitle, FeatureTitle } from '../../components/common/GradientTitles/GradientTitles';
import InfiniteWall from '../../components/features/InfiniteWall/InfiniteWall';
import '../../styles/themeShell.css';
import './Home.css';

const Home = () => {
  const heroRef = React.useRef(null);
  const newSectionRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    // Initialize animations
    initScrollAnimations();
    
    // Add reveal animations to hero elements
    if (heroRef.current) {
      const title = heroRef.current.querySelector('.hero-title');
      const subtitle = heroRef.current.querySelector('.hero-subtitle');
      const credibility = heroRef.current.querySelector('.hero-credibility');
      const actions = heroRef.current.querySelector('.hero-actions');
      
      addRevealClass(title, 0);
      addRevealClass(subtitle, 1);
      addRevealClass(credibility, 2);
      addRevealClass(actions, 3);
    }

    // Add reveal animations to new section
    if (newSectionRef.current) {
      const textContent = newSectionRef.current.querySelector('.text-content');
      const headlineLines = newSectionRef.current.querySelectorAll('.headline-line');
      const subtext = newSectionRef.current.querySelector('.boring-subtitle');
      const imageContent = newSectionRef.current.querySelector('.deepfake-image');
      const imageWrapper = newSectionRef.current.querySelector('.image-content');
      
      // Stagger headline lines first
      headlineLines.forEach((line, index) => {
        addRevealClass(line, index);
      });
      
      // Subtext after headline
      addRevealClass(subtext, 3);
      
      // Image with advanced reveal animation
      if (imageContent) {
        imageContent.classList.add('reveal');
        addRevealClass(imageContent, 4);
        
        // Trigger light sweep when image becomes visible
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                imageWrapper.classList.add('has-visible-image');
              }, 1500); // Wait for image reveal to complete
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        
        observer.observe(imageContent);
      }
    }

    // Soft Parallax Scroll Effect
    const handleScroll = () => {
      const offset = window.scrollY * 0.2;
      const el = document.querySelector('.hero-parallax');
      if(el){
        el.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreateVideo = () => {
    console.log("Create clicked");
    navigate('/create');
  };

  const features = [
    {
      icon: <Zap size={24} />,
      title: 'Fast AI Generation',
      description: 'Generate videos in minutes with our optimized AI pipeline and cloud infrastructure.',
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    },
    {
      icon: <Shield size={24} />,
      title: 'Consent-based & Ethical',
      description: 'Built with explicit consent verification and strict ethical guidelines for responsible usage.',
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    },
    {
      icon: <Globe size={24} />,
      title: 'API-first Platform',
      description: 'Enterprise-grade APIs with comprehensive documentation and developer-friendly integration.',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    },
    {
      icon: <Users size={24} />,
      title: 'High Quality Output',
      description: 'Professional-grade video generation with advanced AI models and quality assurance.',
      color: '#ec4899',
      bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    },
    {
      icon: <Camera size={24} />,
      title: 'Smart Face Mapping',
      description: 'Precision facial recognition and mapping technology for seamless, natural-looking results.',
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    },
    {
      icon: <Layers size={24} />,
      title: 'Multi-layer Compositing',
      description: 'Combine audio, video, and effects with intelligent layering for cinematic productions.',
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)'
    }
  ];

  return (
    <div className="theme-shell">
      <div className="home-wrapper">
        <div className="shared-container">
          {/* Hero Section */}
          <section className="hero-section" ref={heroRef}>
            <div className="hero-parallax">
              <div className="hero-container">
                <div className="premium-container">
                  {/* Depth Layer - Soft Moving Gradient Glow */}
                  <div className="hero-glow"></div>
                  <div className="hero-content">
                    {/* Hero Title with Cinematic Entry */}
                    <h1 className="hero-title reveal-title">
                      Create AI Videos <br/> Without Limits
                    </h1>
                  
                  <p className="hero-subtitle reveal">
                    Transform your ideas into professional videos with our advanced AI technology. 
                    Fast, reliable, and enterprise-ready.
                  </p>
                  
                  <div className="hero-credibility reveal">
                    <div className="trust-indicators">
                      <span className="trust-item">✓ Enterprise-grade security</span>
                      <span className="trust-item">✓ 99.9% uptime SLA</span>
                      <span className="trust-item">✓ GDPR compliant</span>
                    </div>
                  </div>
                  
                  <div className="hero-actions reveal">
                    <Link to="/create" className="cta-button">
                      <Play size={20} />
                      Create
                    </Link>
                    <Link to="/explore-features" className="secondary-button">
                      Explore Features
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* AI Video Doesn't Have to Be Boring Section */}
          <section className="boring-section" ref={newSectionRef}>
            <div className="boring-container">
              <div className="text-content">
                <div className="headline">
                  <div className="headline-line">AI video doesn't have</div>
                  <div className="headline-line">to be <span className="accent-highlight">boring</span></div>
                </div>
                <p className="boring-subtitle">
                  We give you more control for more engagement
                </p>
              </div>
              <div className="image-content">
                <img 
                  src="/deepfake.avif" 
                  alt="AI Video Generation" 
                  className="deepfake-image"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Infinite Horizontal Video Wall - Outside shared-container for full width */}
        <InfiniteWall />

        <div className="shared-container">
          {/* Features Section */}
          <section className="features-section">
            <div className="features-container">
              <div className="features-header">
                {/* Section Title with Partial Gradient */}
                <SectionTitle className="features-title">
                  Everything you need to scale your video production
                </SectionTitle>
                <p className="features-subtitle">
                  Our platform provides all the tools and features you need to create 
                  professional AI videos with ease and confidence.
                </p>
              </div>
              <div className="features-grid">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="feature-card colorful-card"
                    style={{ '--card-color': feature.color }}
                  >
                    <div 
                      className="feature-icon"
                      style={{ 
                        color: feature.color, 
                        background: feature.bgGradient,
                        borderColor: `color-mix(in srgb, ${feature.color} 30%, transparent)`
                      }}
                    >
                      {feature.icon}
                    </div>
                    {/* Feature Title with Partial Gradient */}
                    <FeatureTitle className="feature-title">{feature.title}</FeatureTitle>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Credibility Section Removed */}
        </div>
      </div>
    </div>
  );
};

export default Home;
