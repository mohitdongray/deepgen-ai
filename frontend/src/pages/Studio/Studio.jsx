/**
 * Studio Page — Category-specific AI generation hub
 * /studio?category=video | image | audio
 *
 * Shows curated sub-tools for each category in a premium
 * glassmorphic card grid matching the site-wide design system.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Video, Image as ImageIcon, Mic, ArrowLeft,
  Sparkles, Zap, Film, Camera, Globe, User,
  Layers, Wand2, Music, FileText, Palette,
  RefreshCw, Star, Clock, ChevronRight, Play,
  Type, Crop, Maximize, Volume2
} from 'lucide-react';
import './Studio.css';

// ─────────────────────────────────────────────────────────────
//  CATEGORY METADATA
// ─────────────────────────────────────────────────────────────
const CATEGORIES = {
  video: {
    label: 'AI Video',
    icon: Video,
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
    accent: '#7c3aed',
    glow: 'rgba(124,58,237,0.35)',
    tagline: 'Generate, animate & transform video with AI',
  },
  image: {
    label: 'AI Image',
    icon: ImageIcon,
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
    accent: '#0ea5e9',
    glow: 'rgba(14,165,233,0.35)',
    tagline: 'Create stunning visuals from text & references',
  },
  audio: {
    label: 'AI Audio',
    icon: Mic,
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 60%, #34d399 100%)',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.35)',
    tagline: 'Clone voices, dub videos & synthesize speech',
  },
};

// ─────────────────────────────────────────────────────────────
//  TOOLS PER CATEGORY
// ─────────────────────────────────────────────────────────────
const TOOLS = {
  video: [
    {
      id: 'text-to-video',
      title: 'Text → Video Avatar',
      description: 'Write a script or prompt — AI generates a full cinematic video with voiceover, visuals & transitions.',
      icon: Type,
      tags: ['Gemini Veo 3.1', '4K', 'Voiceover'],
      time: '~90s',
      badge: 'Most Popular',
      badgeColor: '#7c3aed',
      gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    },
    {
      id: 'image-to-video',
      title: 'Image → Video',
      description: 'Bring any static photo to life with AI-powered motion, camera pans and scene transitions.',
      icon: Film,
      tags: ['Animate', 'Motion AI', 'HD'],
      time: '~60s',
      badge: null,
      gradient: 'linear-gradient(135deg,#6d28d9,#8b5cf6)',
    },
    {
      id: 'face-swap',
      title: 'AI Face Swap',
      description: 'Seamlessly replace faces in any video or image with natural, photorealistic results.',
      icon: Camera,
      tags: ['Real-time', 'HD Video', 'Image'],
      time: '~30s',
      badge: null,
      gradient: 'linear-gradient(135deg,#ec4899,#db2777)',
    },
    {
      id: 'avatar-video',
      title: 'Avatar Presenter',
      description: 'Create a professional AI avatar presenter from your script — customizable face, voice & expressions.',
      icon: User,
      tags: ['HeyGen', 'Lip-sync', 'Gestures'],
      time: '~2min',
      badge: 'Pro',
      badgeColor: '#7c3aed',
      gradient: 'linear-gradient(135deg,#059669,#047857)',
    },
    {
      id: 'script-to-scene',
      title: 'Script → Scene',
      description: 'Visualize full movie scenes from a screenplay — auto-generates backgrounds, lighting & camera angles.',
      icon: Sparkles,
      tags: ['Cinematic', 'Scene AI', '4K'],
      time: '~3min',
      badge: null,
      gradient: 'linear-gradient(135deg,#7c3aed,#6366f1)',
    },
    {
      id: 'video-enhancement',
      title: 'Video Enhancement',
      description: 'Upscale resolution, reduce noise and correct color — transform low-res footage into pro 4K content.',
      icon: Maximize,
      tags: ['4K Upscale', 'Noise Reduce', 'Color AI'],
      time: '~45s',
      badge: null,
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    },
  ],
  image: [
    {
      id: 'text-to-image',
      title: 'Text → Image',
      description: 'Describe anything in plain text — Qwen & Stable Diffusion XL generate photorealistic or artistic images.',
      icon: Type,
      tags: ['Qwen', 'SD-XL', '1024px'],
      time: '~5s',
      badge: 'Fastest',
      badgeColor: '#0ea5e9',
      gradient: 'linear-gradient(135deg,#0369a1,#0ea5e9)',
    },
    {
      id: 'face-swap',
      title: 'AI Face Swap',
      description: 'Swap faces between images with pixel-perfect precision and natural lighting matching.',
      icon: Camera,
      tags: ['DeepAI', 'HD', 'Instant'],
      time: '~10s',
      badge: null,
      gradient: 'linear-gradient(135deg,#ec4899,#db2777)',
    },
    {
      id: 'image-to-video',
      title: 'Image → Video',
      description: 'Animate your generated image into a smooth AI video — combine generation pipelines seamlessly.',
      icon: Play,
      tags: ['Animate', 'Veo 3.1', 'HD'],
      time: '~90s',
      badge: null,
      gradient: 'linear-gradient(135deg,#6d28d9,#8b5cf6)',
    },
    {
      id: 'ai-content-generation',
      title: 'Style Transfer',
      description: 'Apply any artistic style — oil painting, anime, cyberpunk, watercolor — to your images or photos.',
      icon: Palette,
      tags: ['Style AI', 'HuggingFace', 'Instant'],
      time: '~8s',
      badge: 'New',
      badgeColor: '#0ea5e9',
      gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
    },
    {
      id: 'video-enhancement',
      title: 'Image Upscale',
      description: 'Enhance image resolution up to 4× with AI super-resolution — recover detail from low-quality photos.',
      icon: Maximize,
      tags: ['4× Scale', 'DeepAI', 'SRGAN'],
      time: '~12s',
      badge: null,
      gradient: 'linear-gradient(135deg,#0369a1,#0284c7)',
    },
    {
      id: 'batch-video-production',
      title: 'Batch Generate',
      description: 'Generate multiple image variations simultaneously with different styles, prompts, or aspect ratios.',
      icon: Layers,
      tags: ['Batch', 'Parallel', 'Export'],
      time: '~20s',
      badge: null,
      gradient: 'linear-gradient(135deg,#475569,#334155)',
    },
  ],
  audio: [
    {
      id: 'voice-cloning',
      title: 'AI Voice Cloning Studio',
      description: 'Create a perfect AI voice clone from just 30 seconds of audio — use for any script instantly.',
      icon: Mic,
      image: '/AI Voice Cloning.png',
      tags: ['HeyGen', 'HD Audio', '30s sample'],
      time: '~20s',
      badge: 'Most Popular',
      badgeColor: '#10b981',
      gradient: 'linear-gradient(135deg,#047857,#10b981)',
    },
    {
      id: 'ai-dubbing',
      title: 'Multi-language Dubbing',
      description: 'Dub any video into 175+ languages with perfect lip-sync, preserving original tone & emotion.',
      icon: Globe,
      tags: ['175+ Languages', 'Lip-sync', 'HeyGen'],
      time: '~2min',
      badge: 'Pro',
      badgeColor: '#10b981',
      gradient: 'linear-gradient(135deg,#065f46,#059669)',
    },
    {
      id: 'text-to-video',
      title: 'Text → Speech Video',
      description: 'Convert a script into a narrated video with AI voice — complete with visuals and timing.',
      icon: Volume2,
      tags: ['TTS', 'Voiceover', 'Video'],
      time: '~90s',
      badge: null,
      gradient: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
    },
    {
      id: 'avatar-video',
      title: 'Talking Avatar',
      description: 'Generate a realistic talking-head video with your cloned voice and a digital avatar presenter.',
      icon: User,
      tags: ['HeyGen', 'Avatar', 'Lip-sync'],
      time: '~2min',
      badge: null,
      gradient: 'linear-gradient(135deg,#4338ca,#6366f1)',
    },
    {
      id: 'batch-video-production',
      title: 'Batch Audio Export',
      description: 'Generate audio in multiple languages or voice styles simultaneously for global content campaigns.',
      icon: Layers,
      tags: ['Batch', 'Multi-voice', 'Export'],
      time: '~45s',
      badge: null,
      gradient: 'linear-gradient(135deg,#374151,#1f2937)',
    },
  ],
};

// Removed TOOL_TYPE_MAP as we map directly to tool.id

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────
export default function StudioPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'video';
  const cat = CATEGORIES[category] || CATEGORIES.video;
  const tools = TOOLS[category] || TOOLS.video;

  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, [category]);

  // 3-D tilt
  const onMouseMove = (e, idx) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 16;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * -16;
    el.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) translateY(-6px) scale(1.02)`;
  };

  const onMouseLeave = (idx) => {
    const el = cardRefs.current[idx];
    if (el) el.style.transform = '';
    setHovered(null);
  };

  const handleToolClick = (tool) => {
    navigate(`/workspace?type=${tool.id}`);
  };

  const CatIcon = cat.icon;

  return (
    <div className="studio-shell">
      {/* Ambient orbs removed — switching to clean star background */}

      <div className="studio-inner">

        {/* ── Back ── */}
        <button className="studio-back" onClick={() => navigate('/create')}>
          <ArrowLeft size={16} />
          <span>Back to Create</span>
        </button>

        {/* ── Header ── */}
        <header className={`studio-header ${visible ? 'studio-header--visible' : ''}`}>
          <div className="studio-header-icon" style={{ background: cat.gradient }}>
            <CatIcon size={28} strokeWidth={1.8} color="#fff" />
          </div>
          <div>
            <p className="studio-header-label" style={{ color: cat.accent }}>
              {cat.label} Studio
            </p>
            <h1 className="studio-title">{cat.tagline}</h1>
          </div>
        </header>

        {/* ── Category switcher ── */}
        <div className="studio-switcher">
          {Object.entries(CATEGORIES).map(([key, c]) => {
            const SwitchIcon = c.icon;
            return (
              <button
                key={key}
                className={`studio-switch-btn ${category === key ? 'studio-switch-btn--active' : ''}`}
                style={category === key ? { borderColor: c.accent, color: c.accent } : {}}
                onClick={() => navigate(`/studio?category=${key}`)}
              >
                <SwitchIcon size={15} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tool cards ── */}
        <div className="studio-grid">
          {tools.map((tool, idx) => {
            const TIcon = tool.icon;
            return (
              <div
                key={tool.id + idx}
                ref={el => cardRefs.current[idx] = el}
                className={`studio-card studio-card--stagger-${(idx % 6) + 1} ${visible ? 'studio-card--visible' : ''}`}
                style={{ '--cat-accent': cat.accent, '--cat-glow': cat.glow }}
                onClick={() => handleToolClick(tool)}
                onMouseMove={e => { setHovered(idx); onMouseMove(e, idx); }}
                onMouseLeave={() => onMouseLeave(idx)}
              >
                {/* Glow overlay */}
                <div className="studio-card-glow" />

                {/* Badge */}
                {tool.badge && (
                  <div className="studio-card-badge" style={{ background: `${tool.badgeColor}22`, borderColor: `${tool.badgeColor}55`, color: tool.badgeColor }}>
                    {tool.badge}
                  </div>
                )}

                {/* Icon or Image */}
                {tool.image ? (
                  <div className="studio-card-icon" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
                    <img
                      src={tool.image}
                      alt={tool.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="studio-card-icon" style={{ background: tool.gradient }}>
                    <TIcon size={22} strokeWidth={1.8} color="#fff" />
                  </div>
                )}

                {/* Text */}
                <h3 className="studio-card-title">{tool.title}</h3>
                <p className="studio-card-desc">{tool.description}</p>

                {/* Tags */}
                <div className="studio-card-tags">
                  {tool.tags.map(t => (
                    <span key={t} className="studio-card-tag">{t}</span>
                  ))}
                </div>

                {/* Footer */}
                <div className="studio-card-footer">
                  <div className="studio-card-time">
                    <Clock size={12} />
                    <span>{tool.time}</span>
                  </div>
                  <div className="studio-card-cta">
                    <span>Start</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
