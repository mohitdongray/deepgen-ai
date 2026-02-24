/**
 * Example Usage - Gradient Title Components
 * 
 * Demonstrates how to use gradient titles in React components
 * - Full gradient: linear-gradient(135deg, #ffffff 0%, #6366f1 100%)
 * - Partial gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
 */

import React from 'react';
import { 
  HeroTitle, 
  PageHeaderTitle, 
  SectionTitle, 
  CardTitle, 
  FeatureTitle, 
  BannerTitle, 
  ModalTitle 
} from '../components/common/GradientTitles/GradientTitles';

/**
 * Example Hero Section - Uses Full Gradient
 * Perfect for main page headings and hero sections
 */
const ExampleHeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Full gradient for maximum impact */}
        <HeroTitle>
          Transform Your Ideas Into Stunning Videos
        </HeroTitle>
        
        <p className="hero-subtitle">
          Create professional AI videos in minutes with our advanced technology
        </p>
        
        <button className="cta-button">
          Get Started Free
        </button>
      </div>
    </section>
  );
};

/**
 * Example Page Header - Uses Full Gradient
 * Perfect for page identification and main headings
 */
const ExamplePageHeader = () => {
  return (
    <div className="page-header">
      {/* Full gradient for page identification */}
      <PageHeaderTitle>
        AI Video Generation Platform
      </PageHeaderTitle>
      
      <p className="page-description">
        Enterprise-grade video creation powered by artificial intelligence
      </p>
    </div>
  );
};

/**
 * Example Section Title - Uses Partial Gradient
 * Perfect for section headings and content organization
 */
const ExampleSection = () => {
  return (
    <section className="features-section">
      <div className="section-container">
        {/* Partial gradient for subtle hierarchy */}
        <SectionTitle>
          Powerful Features for Modern Teams
        </SectionTitle>
        
        <p className="section-description">
          Everything you need to create, manage, and scale your video production
        </p>
        
        <div className="features-grid">
          {/* Feature cards with partial gradient titles */}
          <div className="feature-card">
            <FeatureTitle>
              Fast AI Generation
            </FeatureTitle>
            <p>Generate videos in minutes with optimized AI pipeline</p>
          </div>
          
          <div className="feature-card">
            <FeatureTitle>
              Enterprise Security
            </FeatureTitle>
            <p>Built with enterprise-grade security and compliance</p>
          </div>
          
          <div className="feature-card">
            <FeatureTitle>
              API Integration
            </FeatureTitle>
            <p>Comprehensive APIs for seamless integration</p>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Example Card Component - Uses Partial Gradient
 * Perfect for card headings and content titles
 */
const ExampleCard = ({ title, description, icon }) => {
  return (
    <div className="card">
      <div className="card-icon">
        {icon}
      </div>
      
      {/* Partial gradient for card hierarchy */}
      <CardTitle>
        {title}
      </CardTitle>
      
      <p className="card-description">
        {description}
      </p>
    </div>
  );
};

/**
 * Example Banner - Uses Partial Gradient
 * Perfect for promotional content and announcements
 */
const ExampleBanner = () => {
  return (
    <div className="promo-banner">
      {/* Partial gradient for promotional emphasis */}
      <BannerTitle>
        Limited Time: 50% Off Pro Plan
      </BannerTitle>
      
      <p className="banner-description">
        Upgrade now and unlock advanced AI features
      </p>
      
      <button className="banner-cta">
        Upgrade Now
      </button>
    </div>
  );
};

/**
 * Example Modal - Uses Partial Gradient
 * Perfect for dialog titles and modal headers
 */
const ExampleModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* Partial gradient for dialog hierarchy */}
        <ModalTitle>
          Create New Video
        </ModalTitle>
        
        <div className="modal-content">
          <p>Choose your video creation method:</p>
          
          <div className="modal-options">
            <button className="modal-option">Text to Video</button>
            <button className="modal-option">Image to Video</button>
            <button className="modal-option">Face Swap</button>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Complete Page Example - Shows gradient hierarchy
 */
const ExamplePage = () => {
  return (
    <div className="page">
      {/* Full gradient for main hero */}
      <ExampleHeroSection />
      
      {/* Full gradient for page identification */}
      <ExamplePageHeader />
      
      {/* Partial gradient for sections */}
      <ExampleSection />
      
      {/* Partial gradient for cards */}
      <div className="cards-grid">
        <ExampleCard 
          title="AI Technology" 
          description="Advanced neural networks for realistic video generation"
          icon={<TechIcon />}
        />
        <ExampleCard 
          title="Cloud Processing" 
          description="Scalable cloud infrastructure for fast processing"
          icon={<CloudIcon />}
        />
        <ExampleCard 
          title="Quality Assurance" 
          description="Automated quality checks and human review process"
          icon={<QualityIcon />}
        />
      </div>
      
      {/* Partial gradient for promotional content */}
      <ExampleBanner />
      
      {/* Partial gradient for modals */}
      <ExampleModal isOpen={false} onClose={() => {}} />
    </div>
  );
};

// Icon components (simplified examples)
const TechIcon = () => <span>🤖</span>;
const CloudIcon = () => <span>☁️</span>;
const QualityIcon = () => <span>✨</span>;

export {
  ExampleHeroSection,
  ExamplePageHeader,
  ExampleSection,
  ExampleCard,
  ExampleBanner,
  ExampleModal,
  ExamplePage
};

export default ExamplePage;
