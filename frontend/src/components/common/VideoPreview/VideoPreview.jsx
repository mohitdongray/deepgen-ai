/**
 * Reusable Video Preview Component
 * 
 * Handles video and image media display with proper sizing and effects
 * - Autoplay videos with muted/loop/playsInline
 * - Icon placeholders for cards without media
 * - Responsive sizing and hover effects
 * - Consistent styling across all feature cards
 */

import React from 'react';
import { Camera, Mic, Globe, Users, Film, Layers, Zap, Shield } from 'lucide-react';

const VideoPreview = ({ media, mediaType, icon: Icon }) => {
  return (
    <div className="feature-visual reveal">
      {mediaType === 'video' && media ? (
        <video 
          src={media} 
          autoPlay 
          muted 
          loop 
          playsInline
          className="feature-video"
        />
      ) : Icon ? (
        <div className="feature-placeholder">
          <Icon size={48} />
        </div>
      ) : (
        <div className="feature-placeholder">
          <Zap size={48} />
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
