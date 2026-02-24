/**
 * Footer Component
 * 
 * Site footer with ethical guidelines and links.
 */

import React from 'react';
import { Github, Mail, Phone, MapPin } from 'lucide-react';
import { addRevealClass, initScrollAnimations } from '../../../styles/animations.js';
import './Footer.css';

const Footer = () => {
  const footerRef = React.useRef(null);

  React.useEffect(() => {
    // Initialize animations
    initScrollAnimations();
    
    // Add reveal animation to footer elements
    if (footerRef.current) {
      const brand = footerRef.current.querySelector('.footer-brand');
      const linksGrid = footerRef.current.querySelector('.footer-links-grid');
      const bottom = footerRef.current.querySelector('.footer-bottom');
      
      addRevealClass(brand, 0);
      addRevealClass(linksGrid, 1);
      addRevealClass(bottom, 2);
    }
  }, []);
  return (
    <footer className="footer" ref={footerRef}>
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <div className="logo-icon"></div>
              <span className="brand-text">DeepGen AI</span>
            </div>
            <p className="brand-description">
              Build AI-powered video generation platform with enterprise-grade 
              security and scalability.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <Github size={20} />
              </a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-links">
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">API</a></li>
                <li><a href="#">Integrations</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Developers</h4>
              <ul className="footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">SDKs</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright">
              © 2024 DeepGen AI. All rights reserved.
            </p>
          </div>
          
          <div className="footer-bottom-right">
            <div className="contact-info">
              <span className="contact-item">
                <Mail size={16} />
                contact@deepgen.ai
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
