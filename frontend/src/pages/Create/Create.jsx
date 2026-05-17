/**
 * Create Page - DeepGen AI
 * Premium glassmorphic creation hub with animated cards,
 * particle orbs, feature badges, and a live AI prompt bar.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Image, Mic, Sparkles, Zap, Layers,
  ArrowRight, Play, Star, Clock, Shield, ChevronRight
} from 'lucide-react';
import './Create.css';

const CREATE_OPTIONS = [
  {
    id: 'video',
    title: 'AI Video',
    subtitle: 'Text → Video Avatar',
    description: 'Transform your ideas into stunning cinematic videos powered by Gemini Veo 3.1 and HeyGen AI.',
    icon: Video,
    accentColor: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.4)',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #9333ea 100%)',
    borderGlow: 'rgba(139, 92, 246, 0.5)',
    tags: ['Veo 3.1', 'HeyGen', '4K'],
    badge: 'Most Popular',
    badgeColor: '#7c3aed',
    stats: [
      { icon: Zap, label: '~90s generate' },
      { icon: Star, label: '4K Quality' },
    ],
  },
  {
    id: 'image',
    title: 'AI Image',
    subtitle: 'Prompt → Art',
    description: 'Generate photorealistic images and concept art using Qwen, DeepAI, and Stable Diffusion XL.',
    icon: Image,
    accentColor: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.35)',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
    borderGlow: 'rgba(56, 189, 248, 0.5)',
    tags: ['Qwen', 'SD-XL', '1024px'],
    badge: 'New',
    badgeColor: '#0ea5e9',
    stats: [
      { icon: Clock, label: '~5s generate' },
      { icon: Layers, label: 'Multi-style' },
    ],
  },
  {
    id: 'audio',
    title: 'AI Audio',
    subtitle: 'Text → Speech',
    description: 'Clone voices and generate ultra-realistic speech with HeyGen\'s voice synthesis engine.',
    icon: Mic,
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 60%, #34d399 100%)',
    borderGlow: 'rgba(52, 211, 153, 0.5)',
    tags: ['HeyGen', 'Clone', 'HD Audio'],
    badge: 'Pro',
    badgeColor: '#10b981',
    stats: [
      { icon: Shield, label: 'Ethical AI' },
      { icon: Zap, label: 'Realtime' },
    ],
  },
];

const PROMPTS = [
  'A cinematic drone shot over a neon-lit cyberpunk city at rain...',
  'A hyper-realistic portrait of an astronaut on Mars at sunset...',
  'An epic fantasy battle scene with dragons and lightning...',
  'A serene Japanese garden in cherry blossom season, timelapse...',
  'A product promo video for a futuristic smartwatch...',
];

export default function CreatePage() {
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Staggered card entrance
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Rotating placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PROMPTS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // 3-D tilt on mouse move
  const handleMouseMove = (e, idx) => {
    const card = cardsRef.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 18;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -18;
    card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) translateY(-8px) scale(1.02)`;
  };

  const handleMouseLeave = (idx) => {
    const card = cardsRef.current[idx];
    if (card) card.style.transform = '';
    setHoveredCard(null);
  };

  const handleOptionClick = (id) => {
    // Map 'voice' card → audio category in Studio
    const categoryMap = { video: 'video', image: 'image', voice: 'audio', audio: 'audio' };
    const cat = categoryMap[id] || id;
    navigate(`/studio?category=${cat}`);
  };

  const handlePromptSubmit = () => {
    if (promptText.trim()) navigate(`/studio?prompt=${encodeURIComponent(promptText)}`);
  };

  return (
    <div className="create-shell">
      {/* Ambient background orbs */}
      <div className="create-orb create-orb--purple" />
      <div className="create-orb create-orb--blue" />
      <div className="create-orb create-orb--green" />

      <div className="create-inner">

        {/* ── Header ── */}
        <header className={`create-header ${isVisible ? 'create-header--visible' : ''}`}>
          <div className="create-header-pill">
            <Sparkles size={13} />
            <span>Powered by Gemini Veo · HeyGen · Qwen · SD-XL</span>
          </div>
          <h1 className="create-title">
            Choose what to<br />
            <span className="create-title-gradient">create today</span>
          </h1>
          <p className="create-subtitle">
            Select a creation type below, or describe anything in the prompt bar — our AI decides the best model automatically.
          </p>
        </header>

        {/* ── Cards ── */}
        <div className="create-cards">
          {CREATE_OPTIONS.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                ref={el => cardsRef.current[idx] = el}
                className={`create-card create-card--stagger-${idx + 1} ${isVisible ? 'create-card--visible' : ''}`}
                style={{ '--accent': opt.accentColor, '--glow': opt.glowColor, '--border-glow': opt.borderGlow }}
                onClick={() => handleOptionClick(opt.id)}
                onMouseMove={e => { setHoveredCard(idx); handleMouseMove(e, idx); }}
                onMouseLeave={() => handleMouseLeave(idx)}
              >
                {/* Glow overlay on hover */}
                <div className="create-card-glow" />

                {/* Badge */}
                <div className="create-card-badge" style={{ background: `${opt.accentColor}22`, borderColor: `${opt.accentColor}55`, color: opt.accentColor }}>
                  {opt.badge}
                </div>

                {/* Icon orb */}
                <div className="create-card-icon-wrap" style={{ background: opt.gradient }}>
                  <Icon size={28} strokeWidth={1.8} color="#fff" />
                  <div className="create-card-icon-ring" />
                </div>

                {/* Text */}
                <div className="create-card-body">
                  <p className="create-card-subtitle">{opt.subtitle}</p>
                  <h2 className="create-card-title">{opt.title}</h2>
                  <p className="create-card-desc">{opt.description}</p>
                </div>

                {/* Tags */}
                <div className="create-card-tags">
                  {opt.tags.map(tag => (
                    <span key={tag} className="create-card-tag">{tag}</span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="create-card-stats">
                  {opt.stats.map(({ icon: StatIcon, label }) => (
                    <div key={label} className="create-card-stat">
                      <StatIcon size={13} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA footer */}
                <div className="create-card-footer">
                  <span>Start creating</span>
                  <div className="create-card-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>

                {/* Animated border */}
                <div className="create-card-border" />
              </div>
            );
          })}
        </div>

        {/* ── OR separator ── */}
        <div className="create-or">
          <div className="create-or-line" />
          <span>or describe anything</span>
          <div className="create-or-line" />
        </div>

        {/* ── Floating AI Prompt Bar ── */}
        <div className="create-prompt-bar">
          <div className="create-prompt-icon">
            <Sparkles size={18} color="#a78bfa" />
          </div>
          <input
            className="create-prompt-input"
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder={PROMPTS[placeholderIndex]}
            onKeyDown={e => e.key === 'Enter' && handlePromptSubmit()}
          />
          <button
            className="create-prompt-btn"
            onClick={handlePromptSubmit}
            disabled={!promptText.trim()}
          >
            <Play size={15} fill="white" color="white" />
            <span>Generate</span>
          </button>
        </div>

        {/* ── Footer note ── */}
        <p className="create-footer-note">
          <Shield size={13} />
          All AI generation is consent-gated and ethically sourced. Commercial use included.
        </p>

      </div>
    </div>
  );
}
