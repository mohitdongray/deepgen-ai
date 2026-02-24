import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowLeft, ArrowRight, Upload as UploadIcon, 
  Type, Image as ImageIcon, Video, Mic, 
  Globe, User, Film, Sparkles, Check, 
  Layers, Zap, Shield, Camera
} from 'lucide-react';
import './Upload.css';

// --- CONFIGURATION FOR ALL TOOLS ---
// This maps the URL "type" to the Form UI
const FEATURE_CONFIG = {
  // 1. Text to Video
  'text-to-video': {
    title: 'Turn Text Into Video',
    description: 'Transform your script into a professional video with AI voiceover.',
    icon: <Type size={32} />,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    required: ['script']
  },
  // 2. Image to Video
  'image-to-video': {
    title: 'Animate Your Image',
    description: 'Bring static images to life with AI-driven motion.',
    icon: <ImageIcon size={32} />,
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    required: ['image', 'prompt']
  },
  // 3. AI Face Swap
  'face-swap': {
    title: 'AI Face Swap',
    description: 'Seamlessly replace faces in videos and images.',
    icon: <Camera size={32} />,
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    required: ['image', 'targetImage'] // Requires 2 uploads
  },
  // 4. Voice Cloning
  'voice-cloning': {
    title: 'AI Voice Cloning Studio',
    description: 'Create perfect AI voice clones from audio samples.',
    icon: <Mic size={32} />,
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    required: ['audio']
  },
  // 5. AI Dubbing
  'ai-dubbing': {
    title: 'Translate & Dub Video',
    description: 'Automatically translate and lip-sync videos into other languages.',
    icon: <Globe size={32} />,
    gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    required: ['video', 'language']
  },
  // 6. Avatar Presenter
  'avatar-video': {
    title: 'AI Avatar Studio',
    description: 'Create a professional presentation with a digital avatar.',
    icon: <User size={32} />,
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    required: ['script', 'avatar']
  },
  // 7. Script to Scene
  'script-to-scene': {
    title: 'Generate Scene from Script',
    description: 'Visualize movie scenes directly from your screenplay.',
    icon: <Film size={32} />,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
    required: ['script']
  },
  // 8. Video Enhancement
  'video-enhancement': {
    title: 'Enhance Video Quality',
    description: 'Upscale resolution and fix lighting in your footage.',
    icon: <Sparkles size={32} />,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    required: ['video']
  },
  // 9. Batch Production
  'batch-video-production': {
    title: 'Batch Video Production',
    description: 'Generate multiple video variations simultaneously.',
    icon: <Zap size={32} />,
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    required: ['script'] // Simplified for demo
  },
  // 10. AI Content Generation (THE MISSING ONE FROM YOUR SCREENSHOT)
  'ai-content-generation': {
    title: 'AI Content Generator',
    description: 'Generate complete video content from scratch using AI prompts.',
    icon: <Shield size={32} />, // Using Shield as placeholder or Layers
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    required: ['script']
  }
};

const UploadPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 1. Get Active Feature
  // We check the URL param 'type' OR localStorage
  const activeType = searchParams.get('type') || localStorage.getItem('selectedFeature');
  const activeConfig = FEATURE_CONFIG[activeType];

  // 2. Form State
  const [formData, setFormData] = useState({
    script: '',
    prompt: '',
    image: null,     // Primary Image
    targetImage: null, // For Face Swap
    video: null,
    audio: null,
    voice: 'en-US-female',
    language: 'es-ES',
    style: 'cinematic',
    avatar: 'business-professional'
  });
  
  const [hasConsent, setHasConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Reset form when switching types
  useEffect(() => {
    if (!activeType) {
        // If no type is selected, potentially show a grid selection here or redirect
    }
    setError('');
    setHasConsent(false);
  }, [activeType]);

  // Scroll to top whenever component mounts or activeType changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeType]);

  // 3. Dropzone Handlers (Generic to handle different fields)
  const onDrop = useCallback((acceptedFiles, fieldName) => {
    const file = acceptedFiles[0];
    if (file) setFormData(prev => ({ ...prev, [fieldName]: file }));
  }, []);

  // Initialize dropzones for different types
  const imageDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'image'),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const targetImageDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'targetImage'),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const videoDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'video'),
    accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
    maxFiles: 1
  });

  const audioDropzone = useDropzone({
    onDrop: (files) => onDrop(files, 'audio'),
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] },
    maxFiles: 1
  });

  // 4. Validation
  const canGenerate = () => {
    if (!activeConfig || !hasConsent) return false;
    const reqs = activeConfig.required;
    
    if (reqs.includes('script') && !formData.script?.trim()) return false;
    if (reqs.includes('prompt') && !formData.prompt?.trim()) return false;
    if (reqs.includes('image') && !formData.image) return false;
    if (reqs.includes('targetImage') && !formData.targetImage) return false;
    if (reqs.includes('video') && !formData.video) return false;
    if (reqs.includes('audio') && !formData.audio) return false;
    
    return true;
  };

  const handleGenerate = () => {
    if (!canGenerate()) {
        setError("Please fill in all required fields and accept the terms.");
        return;
    }
    setIsGenerating(true);
    setTimeout(() => {
        setIsGenerating(false);
        alert(`Simulating generation for ${activeType}...`);
    }, 2000);
  };

  const handleSelectFeature = (key) => {
    localStorage.setItem('selectedFeature', key);
    setSearchParams({ type: key });
  };

  // --- RENDER: GRID VIEW (Only if no valid tool selected) ---
  if (!activeType || !activeConfig) {
    return (
      <div className="upload-page-container">
        <div className="upload-header">
          <h1>Create AI Content</h1>
          <p>Choose a tool to start generating.</p>
        </div>
        <div className="feature-grid">
          {Object.entries(FEATURE_CONFIG).map(([key, config]) => (
            <div key={key} className="feature-card" onClick={() => handleSelectFeature(key)}>
              <div className="feature-icon-wrapper" style={{ background: config.gradient }}>
                {config.icon}
              </div>
              <h3>{config.title}</h3>
              <p>{config.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- RENDER: TOOL FORM (Dynamic) ---
  return (
    <div className="upload-page-container">
      <button className="back-button" onClick={() => setSearchParams({})}>
        <ArrowLeft size={16} /> Back to Tools
      </button>

      <div className="upload-header">
        <h1>{activeConfig.title}</h1>
        <p>{activeConfig.description}</p>
      </div>

      <div className="dynamic-form-wrapper">
        
        {/* === UPLOAD SECTIONS === */}
        
        {/* 1. Primary Image Upload */}
        {(activeConfig.required.includes('image')) && (
            <div className="form-group">
                <label>Upload Source Image</label>
                <div {...imageDropzone.getRootProps()} className={`dropzone ${formData.image ? 'has-file' : ''}`}>
                    <input {...imageDropzone.getInputProps()} />
                    {formData.image ? (
                        <div className="file-preview">
                            <Check className="success-icon" /> 
                            <span>{formData.image.name}</span>
                        </div>
                    ) : (
                        <div className="dropzone-placeholder">
                            <ImageIcon />
                            <p>Drag & drop an image</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 2. Target Image Upload (Face Swap) */}
        {(activeConfig.required.includes('targetImage')) && (
            <div className="form-group">
                <label>Upload Target Face Image</label>
                <div {...targetImageDropzone.getRootProps()} className={`dropzone ${formData.targetImage ? 'has-file' : ''}`}>
                    <input {...targetImageDropzone.getInputProps()} />
                    {formData.targetImage ? (
                        <div className="file-preview">
                            <Check className="success-icon" /> 
                            <span>{formData.targetImage.name}</span>
                        </div>
                    ) : (
                        <div className="dropzone-placeholder">
                            <Camera />
                            <p>Drag & drop the target face</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 3. Video Upload */}
        {(activeConfig.required.includes('video')) && (
            <div className="form-group">
                <label>Upload Video</label>
                <div {...videoDropzone.getRootProps()} className={`dropzone ${formData.video ? 'has-file' : ''}`}>
                    <input {...videoDropzone.getInputProps()} />
                    {formData.video ? (
                        <div className="file-preview">
                            <Check className="success-icon" /> 
                            <span>{formData.video.name}</span>
                        </div>
                    ) : (
                        <div className="dropzone-placeholder">
                            <Video />
                            <p>Drag & drop a video file</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* 4. Audio Upload */}
        {(activeConfig.required.includes('audio')) && (
            <div className="form-group">
                <label>Upload Audio Sample</label>
                <div {...audioDropzone.getRootProps()} className={`dropzone ${formData.audio ? 'has-file' : ''}`}>
                    <input {...audioDropzone.getInputProps()} />
                    {formData.audio ? (
                        <div className="file-preview">
                            <Check className="success-icon" /> 
                            <span>{formData.audio.name}</span>
                        </div>
                    ) : (
                        <div className="dropzone-placeholder">
                            <Mic />
                            <p>Drag & drop an audio file (mp3/wav)</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === TEXT INPUTS === */}
        
        {/* Script Input */}
        {(activeConfig.required.includes('script')) && (
            <div className="form-group">
                <label>
                    {activeType === 'ai-content-generation' ? 'Describe Your Content' : 'Video Script'}
                </label>
                <textarea 
                    className="premium-input textarea-large"
                    placeholder={activeType === 'ai-content-generation' ? "Describe the video you want to generate in detail..." : "Write your script here..."}
                    value={formData.script}
                    onChange={(e) => setFormData({...formData, script: e.target.value})}
                />
            </div>
        )}

        {/* Motion Prompt Input */}
        {(activeConfig.required.includes('prompt')) && (
            <div className="form-group">
                <label>Motion Prompt</label>
                <textarea 
                    className="premium-input textarea-medium"
                    placeholder="Describe the movement (e.g. 'Camera pans left, water flows')..."
                    value={formData.prompt}
                    onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                />
            </div>
        )}

        {/* === DROPDOWNS & OPTIONS === */}
        <div className="form-row">
            {/* Voice Selection */}
            {(['text-to-video', 'avatar-video', 'ai-content-generation'].includes(activeType)) && (
                <div className="form-group">
                    <label>Voice Style</label>
                    <div className="select-wrapper">
                        <select 
                            className="premium-input"
                            value={formData.voice}
                            onChange={(e) => setFormData({...formData, voice: e.target.value})}
                        >
                            <option value="en-US-female">American Female (Professional)</option>
                            <option value="en-US-male">American Male (Deep)</option>
                            <option value="uk-female">British Female (Narrative)</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Language Selection */}
            {activeType === 'ai-dubbing' && (
                <div className="form-group">
                    <label>Target Language</label>
                    <div className="select-wrapper">
                        <select 
                            className="premium-input"
                            value={formData.language}
                            onChange={(e) => setFormData({...formData, language: e.target.value})}
                        >
                            <option value="es-ES">Spanish (Spain)</option>
                            <option value="fr-FR">French</option>
                            <option value="de-DE">German</option>
                            <option value="ja-JP">Japanese</option>
                        </select>
                    </div>
                </div>
            )}
            
            {/* Avatar Selection */}
            {activeType === 'avatar-video' && (
                 <div className="form-group">
                 <label>Avatar Model</label>
                 <div className="select-wrapper">
                     <select 
                         className="premium-input"
                         value={formData.avatar}
                         onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                     >
                         <option value="business-professional">Business Professional</option>
                         <option value="casual-anchor">Casual Anchor</option>
                         <option value="tech-expert">Tech Expert</option>
                     </select>
                 </div>
             </div>
            )}
        </div>

        {/* === CONSENT & ACTION === */}
        <div className="consent-wrapper">
            <label className="checkbox-container">
                <input 
                    type="checkbox" 
                    checked={hasConsent} 
                    onChange={(e) => setHasConsent(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="consent-text">
                    I confirm that I have explicit permission to use any uploaded assets.
                </span>
            </label>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <button 
            className={`generate-btn ${isGenerating ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={!canGenerate() || isGenerating}
        >
            {isGenerating ? (
                <span>Processing...</span>
            ) : (
                <>
                    <span>Generate Content</span>
                    <ArrowRight size={20} />
                </>
            )}
        </button>

      </div>
    </div>
  );
};

export default UploadPage;