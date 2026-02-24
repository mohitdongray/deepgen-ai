import React from 'react';
import { Twitter, Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="modern-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <div className="logo-icon"></div>
              <span className="brand-text">YourBrand</span>
            </div>
            <p className="brand-description">
              Build AI-powered video generation platform with enterprise-grade 
              security and scalability.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link">
                <Linkedin size={20} />
              </a>
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
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Tutorials</a></li>
                <li><a href="#">Support</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright">
              © 2024 YourBrand. All rights reserved.
            </p>
          </div>
          
          <div className="footer-bottom-right">
            <div className="contact-info">
              <span className="contact-item">
                <Mail size={16} />
                contact@yourbrand.com
              </span>
              <span className="contact-item">
                <Phone size={16} />
                +1 (555) 123-4567
              </span>
              <span className="contact-item">
                <MapPin size={16} />
                San Francisco, CA
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
