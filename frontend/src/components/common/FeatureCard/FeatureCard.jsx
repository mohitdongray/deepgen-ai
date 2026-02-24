/**
 * Reusable Feature Card Component
 * 
 * Premium dark card with alternating media/text layout
 * - #070815 background with gradient/aura effect
 * - 1152×452.412px media dimensions
 * - Layered soft shadows for premium look
 * - Alternating media placement per card
 * - Staggered reveal animations
 * - Responsive design
 */

import React from 'react';
import { Camera, Mic, Globe, Users, Film, Layers, Zap, Shield } from 'lucide-react';
import VideoPreview from '../VideoPreview/VideoPreview';
import TextContent from '../TextContent/TextContent';

const FeatureCard = ({ 
  title, 
  description, 
  media, 
  mediaType = 'video',
  icon: Icon,
  onGetStarted,
  index,
  staggerDelay = 0
}) => {
  return (
    <div className="explore-feature-card reveal" style={{ animationDelay: `${staggerDelay}s` }}>
      {/* Media Section - VideoPreview component */}
      <VideoPreview 
        media={media}
        mediaType={mediaType}
        icon={Icon}
      />
      
      {/* Text Content Section - TextContent component */}
      <TextContent 
        title={title}
        description={description}
        onGetStarted={onGetStarted}
        staggerDelay={staggerDelay}
      />
    </div>
  );
};

export default FeatureCard;
