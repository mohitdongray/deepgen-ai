/**
 * Create Page - DeepGen AI
 * 
 * Creation options page with:
 * - Video, Image, Voice creation options
 * - Premium SaaS styling with reveal animations
 * - Responsive layout (desktop row, mobile stacked)
 * - Theme shell wrapper for consistency
 */

import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Image, Mic } from 'lucide-react';
import { addRevealClass, initScrollAnimations } from '../../styles/animations.js';
import '../../styles/themeShell.css';
import './Create.css';

const CreatePage = () => {
  const navigate = useNavigate();
  const createRef = useRef(null);

  useEffect(() => {
    // Initialize animations
    initScrollAnimations();
    
    // Add reveal animations to creation options
    if (createRef.current) {
      const options = createRef.current.querySelectorAll('.create-option');
      options.forEach((option, index) => {
        addRevealClass(option, index);
      });
    }
  }, []);

  const handleOptionClick = (type) => {
    console.log(`${type} option clicked`);
    // Navigate to upload page with type parameter
    navigate(`/upload?type=${type}`);
  };

  const createOptions = [
    {
      id: 'video',
      title: 'Video',
      description: 'Generate AI videos from images and source content',
      icon: <Video size={32} />,
      variant: 'primary',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    },
    {
      id: 'image',
      title: 'Image',
      description: 'Create AI images from text prompts and references',
      icon: <Image size={32} />,
      variant: 'secondary',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
    },
    {
      id: 'voice',
      title: 'Voice',
      description: 'Generate realistic AI voice from text samples',
      icon: <Mic size={32} />,
      variant: 'tertiary',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    }
  ];

  return (
    <div className="theme-shell">
      <div className="shared-container">
        <div className="premium-wrapper">
          <div className="create-page" ref={createRef}>
            <div className="create-header">
              <h1 className="create-title">
                Choose what to create
              </h1>
              <p className="create-subtitle">
                Select the type of content you want to generate with our AI technology
              </p>
            </div>

            <div className="create-options">
              {createOptions.map((option) => (
                <div
                  key={option.id}
                  className={`create-option create-option--${option.variant}`}
                  onClick={() => handleOptionClick(option.id)}
                  style={{
                    background: option.gradient
                  }}
                >
                  <div className="create-option-icon">
                    {option.icon}
                  </div>
                  <div className="create-option-content">
                    <h3 className="create-option-title">{option.title}</h3>
                    <p className="create-option-description">{option.description}</p>
                  </div>
                  <div className="create-option-arrow">
                    →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
