import React from 'react';
import { Zap, Shield, Globe, Users, ArrowRight } from 'lucide-react';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <Zap size={24} />,
      title: "Lightning Fast",
      description: "Generate videos in minutes with our optimized AI pipeline and cloud infrastructure."
    },
    {
      icon: <Shield size={24} />,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with GDPR, CCPA, and industry standards."
    },
    {
      icon: <Globe size={24} />,
      title: "Global Scale",
      description: "Deploy worldwide with CDN distribution and multi-region data centers."
    },
    {
      icon: <Users size={24} />,
      title: "Team Collaboration",
      description: "Work together with real-time collaboration and permission management."
    }
  ];

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">
            Everything you need to
            <span className="gradient-text"> scale your video production</span>
          </h2>
          <p className="features-subtitle">
            Our platform provides all the tools and features you need to create 
            professional AI-generated videos at scale.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <a href="#" className="feature-link">
                Learn more
                <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>

        <div className="features-cta">
          <div className="cta-content">
            <h3 className="cta-title">
              Ready to transform your video production?
            </h3>
            <p className="cta-subtitle">
              Join thousands of companies already using our platform to create 
              engaging video content at scale.
            </p>
            <button className="btn-primary">
              Start Free Trial
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
