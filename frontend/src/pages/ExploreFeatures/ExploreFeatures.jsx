import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mic, Globe, Users, Film, Layers, Zap, Shield } from 'lucide-react';
import { addRevealClass, initScrollAnimations } from '../../styles/animations.js';
import FeatureCard from '../../components/common/FeatureCard/FeatureCard';
import { PageHeaderTitle } from '../../components/common/GradientTitles/GradientTitles';
import '../../styles/themeShell.css';
import './ExploreFeatures.css';

const ExploreFeatures = () => {
  const navigate = useNavigate();
  const heroRef = React.useRef(null);
  const featuresRef = React.useRef(null);

  // Feature cards data array - MATCHING KEYS WITH UploadPage.jsx
  const features = [
    {
      id: 'text-to-video', // Added ID
      title: "Turn text into video with AI",
      description: "Produce complete videos with just a script and text to video AI. Our AI video generator automates and edits entire process and saves hours of production time. Generate a high-quality video (1080p or 4K) with a voiceover, visuals, and AI avatar.",
      media: "/vidtoimg.mp4",
      mediaType: "video"
    },
    {
      id: 'image-to-video', // Added ID
      title: "Image to video with AI",
      description: "Turn any photo into a video. Upload an image, add your script, and quickly transform a photo or image into a talking video. Add text overlays, background music, and scene transitions with no manual editing required.",
      media: "/text_to_video.webm",
      mediaType: "video"
    },
    {
      id: 'face-swap', // Added ID
      title: "AI Face Swap (Video & Image)",
      description: "Seamlessly replace faces in videos and images with advanced AI technology. Perfect for content creators, marketers, and filmmakers who need professional face swapping with natural results.",
      icon: Camera,
      mediaType: "icon"
    },
    {
      id: 'voice-cloning', // Added ID
      title: "AI Voice Cloning Studio",
      description: "Create perfect AI voice clones from just a few minutes of audio. Generate custom voices for brand consistency, character voices, or personalized content.",
      icon: Mic,
      mediaType: "icon"
    },
    {
      id: 'ai-dubbing', // Added ID
      title: "Multi-language AI Dubbing",
      description: "Instantly dub videos into 175+ languages with perfect lip-sync and natural timing. Preserve original emotional tone and context while reaching global audiences.",
      icon: Globe,
      mediaType: "icon"
    },
    {
      id: 'avatar-video', // Added ID
      title: "AI Avatar Presenter Generator",
      description: "Generate realistic AI avatars for presentations, tutorials, and video content. Customizable facial expressions, gestures, and speech syncing to make videos engaging and professional.",
      media: "/photon.mp4",
      mediaType: "video"
    },
    {
      id: 'script-to-scene', // Added ID
      title: "Smart Script-to-Scene Generator",
      description: "Transform written scripts into complete video scenes with AI-powered scene generation. Automatically creates appropriate backgrounds, lighting, camera angles, and transitions based on script context.",
      media: "/RAY 2 Official Premiere_smaller_cut.mp4",
      mediaType: "video"
    },
    {
      id: 'batch-video-production', // Added ID
      title: "Batch Video Production Automation",
      description: "Scale video production with automated batch processing. Generate multiple video variations simultaneously with different styles, languages, or formats.",
      icon: Zap,
      mediaType: "icon"
    },
    {
      id: 'video-enhancement', // Added ID
      title: "AI Video Enhancement",
      description: "Enhance video quality with AI-powered upscaling, noise reduction, and color correction. Transform low-resolution footage into professional 4K content.",
      icon: Film,
      mediaType: "icon"
    }
    // REMOVED: AI Content Generation card
  ];

  React.useEffect(() => {
    initScrollAnimations();
    if (heroRef.current) {
      const title = heroRef.current.querySelector('.page-title');
      const subtitle = heroRef.current.querySelector('.page-subtitle');
      addRevealClass(title, 0);
      addRevealClass(subtitle, 1);
    }
    if (featuresRef.current) {
      const featureCards = featuresRef.current.querySelectorAll('.explore-feature-card');
      featureCards.forEach((card, index) => {
        addRevealClass(card, index * 0.1);
      });
    }
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleGetStarted = (featureId) => {
    localStorage.setItem('selectedFeature', featureId);
    navigate('/upload?type=' + featureId);
  };

  return (
    <div className="explore-features-page">
      <section className="explore-hero" ref={heroRef}>
        <div className="explore-hero-container">
          <button className="back-button" onClick={handleBackClick}>
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="hero-content">
            <PageHeaderTitle className="page-title">
              Explore AI Video Features
            </PageHeaderTitle>
            <p className="page-subtitle">
              Powerful tools to create, transform, and scale video production using AI
            </p>
          </div>
        </div>
      </section>

      <section className="explore-features-section" ref={featuresRef}>
        <div className="explore-features-container">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              index={index}
              title={feature.title}
              description={feature.description}
              media={feature.media}
              mediaType={feature.mediaType}
              icon={feature.icon}
              // IMPORTANT: Pass the specific feature ID here
              onGetStarted={() => handleGetStarted(feature.id)}
              staggerDelay={index * 0.1}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExploreFeatures;