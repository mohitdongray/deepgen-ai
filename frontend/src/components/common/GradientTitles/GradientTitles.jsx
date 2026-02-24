/**
 * Gradient Title Components - Professional Modern Typography
 * 
 * Reusable React components with gradient text styling
 * - Full gradient: linear-gradient(135deg, #ffffff 0%, #6366f1 100%)
 * - Partial gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
 */

import React from 'react';
import '../../../styles/gradient-titles.css';

/**
 * Full Gradient Title - Main headings, hero sections, page headers
 * Uses: linear-gradient(135deg, #ffffff 0%, #6366f1 100%)
 */
const FullGradientTitle = ({ 
  children, 
  as = 'h1', 
  className = '', 
  size = 'hero',
  ...props 
}) => {
  const Tag = as;
  const sizeClass = size === 'hero' ? 'hero-title' : 'page-header-title';
  
  return (
    <Tag 
      className={`title-gradient-full ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

/**
 * Partial Gradient Title - Subheadings, section headings, banners
 * Uses: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
 */
const PartialGradientTitle = ({ 
  children, 
  as = 'h2', 
  className = '', 
  type = 'section',
  ...props 
}) => {
  const Tag = as;
  const typeClass = {
    section: 'section-title',
    card: 'card-title',
    feature: 'feature-title',
    banner: 'banner-title',
    modal: 'modal-title'
  }[type] || 'section-title';
  
  return (
    <Tag 
      className={`title-gradient-partial ${typeClass} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};

/**
 * Hero Section Title - Main hero title with full gradient
 */
const HeroTitle = ({ children, className = '', ...props }) => (
  <FullGradientTitle 
    as="h1" 
    size="hero" 
    className={`hero-title ${className}`}
    {...props}
  >
    {children}
  </FullGradientTitle>
);

/**
 * Page Header Title - Page identification with full gradient
 */
const PageHeaderTitle = ({ children, className = '', ...props }) => (
  <FullGradientTitle 
    as="h1" 
    size="page" 
    className={`page-header-title ${className}`}
    {...props}
  >
    {children}
  </FullGradientTitle>
);

/**
 * Section Title - Section headings with partial gradient
 */
const SectionTitle = ({ children, className = '', ...props }) => (
  <PartialGradientTitle 
    as="h2" 
    type="section" 
    className={`section-title ${className}`}
    {...props}
  >
    {children}
  </PartialGradientTitle>
);

/**
 * Card Title - Card headings with partial gradient
 */
const CardTitle = ({ children, className = '', ...props }) => (
  <PartialGradientTitle 
    as="h3" 
    type="card" 
    className={`card-title ${className}`}
    {...props}
  >
    {children}
  </PartialGradientTitle>
);

/**
 * Feature Title - Feature card headings with partial gradient
 */
const FeatureTitle = ({ children, className = '', ...props }) => (
  <PartialGradientTitle 
    as="h3" 
    type="feature" 
    className={`feature-title ${className}`}
    {...props}
  >
    {children}
  </PartialGradientTitle>
);

/**
 * Banner Title - Promotional content with partial gradient
 */
const BannerTitle = ({ children, className = '', ...props }) => (
  <PartialGradientTitle 
    as="h2" 
    type="banner" 
    className={`banner-title ${className}`}
    {...props}
  >
    {children}
  </PartialGradientTitle>
);

/**
 * Modal Title - Dialog titles with partial gradient
 */
const ModalTitle = ({ children, className = '', ...props }) => (
  <PartialGradientTitle 
    as="h2" 
    type="modal" 
    className={`modal-title ${className}`}
    {...props}
  >
    {children}
  </PartialGradientTitle>
);

export {
  FullGradientTitle,
  PartialGradientTitle,
  HeroTitle,
  PageHeaderTitle,
  SectionTitle,
  CardTitle,
  FeatureTitle,
  BannerTitle,
  ModalTitle
};

export default HeroTitle;
