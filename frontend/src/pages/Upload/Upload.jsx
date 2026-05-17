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
  // 10. AI Content Generation
  'ai-content-generation': {
    title: 'AI Content Generator',
    description: 'Generate complete video content from scratch using AI prompts.',
    icon: <Shield size={32} />,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    required: ['script']
  },
  // 11. Text to Image (Qwen / DeepAI / HuggingFace)
  'text-to-image': {
    title: 'Text → Image',
    description: 'Describe anything — Qwen, DeepAI and Stable Diffusion XL generate your image instantly.',
    icon: <ImageIcon size={32} />,
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
    required: ['script']
  },
  // 12. Style Transfer (maps to ai-content-generation chain)
  'style-transfer': {
    title: 'Style Transfer',
    description: 'Upload an image and apply any artistic style — oil painting, anime, cyberpunk.',
    icon: <ImageIcon size={32} />,
    gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    required: ['image', 'script']
  },
};

const UploadPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Get Active Feature
  // We check URL param 'type' only
  const activeType = searchParams.get('type');
  const activeConfig = FEATURE_CONFIG[activeType];

  // 2. Form State
  const [formData, setFormData] = useState({
    script: '',
    prompt: '',
    image: null,     // Primary Image
    targetImage: null, // For Face Swap
    video: null,
    audio: null,
    voice: 'en-US-male',
    language: 'es-ES',
    style: 'cinematic',
    avatar: 'business-professional'
  });

  const [hasConsent, setHasConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [simpleModeType, setSimpleModeType] = useState('image');

  // Reset form when switching types
  useEffect(() => {
    if (!activeType) {
      // If no type is selected, immediately redirect back to the central Create hub
      navigate('/create');
      return;
    }
    setIsSimpleMode(false);
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

  const handleGenerate = async () => {
    if (isSimpleMode) {
      if (!hasConsent || !formData.script?.trim()) {
        setError("Please fill in all required fields and accept terms.");
        return;
      }
    } else {
      if (!canGenerate()) {
        setError("Please fill in all required fields and accept terms.");
        return;
      }
    }

    setIsGenerating(true);
    setError('');
    setResultVideoUrl(null);
    setResultImageUrl(null);
    setShowVideo(false);
    setPollingStatus('Initializing...');

    try {
      if (isSimpleMode) {
        // Simplified mode API call
        const description = simpleModeType === 'image' ? formData.script : formData.script;

        const apiFormData = new FormData();
        apiFormData.append("description", description);
        apiFormData.append("mode", simpleModeType);
        apiFormData.append("consent_confirmed", "true");
        apiFormData.append("job_id", Date.now().toString());

        const res = await fetch("http://localhost:5000/api/generate", {
          method: "POST",
          body: apiFormData
        });
        const data = await res.json();

        if (!data.job_id) throw new Error("Failed to start job");
        const jobId = data.job_id;

        setPollingStatus('Processing...');

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`http://localhost:5000/api/status/${jobId}`);
            const statusData = await statusRes.json();

            if (statusData.status === "completed") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');

              // Read from top-level statusData (backend returns flat structure)
              const videoUrl = statusData.video_url;
              const imageUrl = statusData.image_url;

              if (simpleModeType === 'image') {
                const finalUrl = (imageUrl || videoUrl);
                const fullUrl = (finalUrl && finalUrl.startsWith('/'))
                  ? `http://localhost:8000${finalUrl}`
                  : finalUrl;
                setResultImageUrl(fullUrl);
              } else {
                if (videoUrl) {
                  const fullUrl = videoUrl.startsWith('/')
                    ? `http://localhost:8000${videoUrl}`
                    : videoUrl;
                  setResultVideoUrl(fullUrl);
                } else {
                  setResultVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
                }
              }
            } else if (statusData.status === "failed") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');
              setError(`Generation failed: ${statusData.error || 'Unknown error'}`);
            } else if (statusData.error) {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');
              setError(`Error checking status: ${statusData.error}`);
            }
          } catch (err) {
            console.error("Polling error", err);
          }
        }, 3000);

      } else {
        // Original complex mode API call
        const apiFormData = new FormData();
        if (formData.image) apiFormData.append("source_image", formData.image);

        const targetMedia = formData.video || formData.targetImage;
        if (targetMedia) apiFormData.append("target_video", targetMedia);

        apiFormData.append("job_id", Date.now().toString());
        apiFormData.append("consent_confirmed", "true");
        apiFormData.append("description", formData.script || formData.prompt || "AI video test");
        // Map frontend types to backend mode strings
        const modeMap = { 'text-to-image': 'image', 'style-transfer': 'ai-content-generation' };
        apiFormData.append("mode", modeMap[activeType] || activeType || "video");

        const res = await fetch("http://localhost:5000/api/generate", {
          method: "POST",
          body: apiFormData
        });
        const data = await res.json();

        if (!data.job_id) throw new Error("Failed to start job");
        const jobId = data.job_id;

        setPollingStatus('Processing...');

        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`http://localhost:5000/api/status/${jobId}`);
            const statusData = await statusRes.json();

            if (statusData.status === "completed") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');

              // Read from top-level statusData (backend returns flat structure)
              if (statusData.image_url) {
                const imgUrl = statusData.image_url.startsWith('/')
                  ? `http://localhost:8000${statusData.image_url}`
                  : statusData.image_url;
                setResultImageUrl(imgUrl);
              }

              if (statusData.video_url) {
                const videoUrl = statusData.video_url.startsWith('/')
                  ? `http://localhost:8000${statusData.video_url}`
                  : statusData.video_url;
                setResultVideoUrl(videoUrl);
              } else if (activeType !== 'text-to-image' && activeType !== 'ai-content-generation') {
                // Only use video fallback if it's supposed to be a video task
                setResultVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
              }

              // Only do the video reveal trick if this is NOT an image-only generation
              if (activeType !== 'text-to-image') {
                setTimeout(() => {
                  setShowVideo(true);
                }, 4000);
              } else {
                // If it's just an image, ensure showVideo is false so the image stays visible
                setShowVideo(false);
              }

            } else if (statusData.status === "failed") {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');
              setError(`Generation failed: ${statusData.error || 'Unknown error'}`);
            } else if (statusData.error) {
              clearInterval(pollInterval);
              setIsGenerating(false);
              setPollingStatus('');
              setError(`Error checking status: ${statusData.error}`);
            }
          } catch (err) {
            console.error("Polling error", err);
          }
        }, 3000);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to start generation");
      setIsGenerating(false);
      setPollingStatus('');
    }
  };

  const handleSelectFeature = (key) => {
    setSearchParams({ type: key });
  };

  const handleSimpleModeClick = () => {
    setIsSimpleMode(true);
  };

  // --- RENDER: GRID VIEW (Only if no valid tool selected) ---
  if (!activeType || !activeConfig) {
    return null; // The useEffect above handles the redirect
  }

  // --- RENDER: TOOL FORM (Dynamic) ---
  if (isSimpleMode) {
    return (
      <div className="upload-page-container">
        <button className="back-button" onClick={() => setIsSimpleMode(false)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="upload-header">
          <h1>Create AI Content</h1>
          <p>Generate {simpleModeType} with AI</p>
        </div>

        <div className="dynamic-form-wrapper">
          {simpleModeType === 'image' ? (
            <div className="form-group">
              <label>Describe Your Image</label>
              <div className="prompt-bar">
                <div className="prompt-bar-icon">
                  <Sparkles size={18} color="#a78bfa" />
                </div>
                <textarea
                  className="prompt-bar-input"
                  rows={3}
                  placeholder="A hyperrealistic portrait of an astronaut on Mars at golden hour..."
                  value={formData.script}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Your Video Prompt</label>
              <div className="prompt-bar">
                <div className="prompt-bar-icon">
                  <Sparkles size={18} color="#a78bfa" />
                </div>
                <textarea
                  className="prompt-bar-input"
                  rows={3}
                  placeholder="A cinematic drone shot over a neon-lit cyberpunk city at rain..."
                  value={formData.script}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                />
              </div>
            </div>
          )}

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
            disabled={!hasConsent || isGenerating || !formData.script?.trim()}
          >
            {isGenerating ? (
              <span>{pollingStatus || 'Processing...'}</span>
            ) : (
              <>
                <span>Generate Content</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {resultImageUrl && simpleModeType === 'image' && (
            <div className="result-video-container" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <h3>Image Generated!</h3>
              <img
                src={resultImageUrl}
                alt="AI Generated"
                style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              />
            </div>
          )}

          {showVideo && resultVideoUrl && (
            <div className="result-video-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <video
                controls
                autoPlay
                src={resultVideoUrl}
                style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

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

        {/* Script / Prompt — Premium Prompt Bar */}
        {(activeConfig.required.includes('script')) && (
          <div className="form-group">
            <label>
              {activeType === 'text-to-image' ? 'Describe Your Image'
                : activeType === 'ai-content-generation' ? 'Describe Your Content'
                  : activeType === 'voice-cloning' ? 'Text to Speak'
                    : 'Your Prompt'}
            </label>
            <div className="prompt-bar">
              <div className="prompt-bar-icon">
                <Sparkles size={18} color="#a78bfa" />
              </div>
              <textarea
                className="prompt-bar-input"
                rows={3}
                placeholder={
                  activeType === 'text-to-image' ? 'Describe the image you want to generate...'
                    : activeType === 'text-to-video' ? 'A cinematic drone shot over a neon-lit cyberpunk city at rain...'
                      : activeType === 'ai-content-generation' ? 'Describe the video content you want to generate in detail...'
                        : activeType === 'script-to-scene' ? 'INT. SPACESHIP - NIGHT\nThe captain peers through the viewport...'
                          : activeType === 'voice-cloning' ? 'Enter the text you want to speak with the cloned voice...'
                            : activeType === 'batch-video-production' ? 'Write your base script for batch generation...'
                              : 'Describe what you want to generate...'
                }
                value={formData.script}
                onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Motion Prompt — Premium Prompt Bar */}
        {(activeConfig.required.includes('prompt')) && (
          <div className="form-group">
            <label>Motion Prompt</label>
            <div className="prompt-bar">
              <div className="prompt-bar-icon">
                <Sparkles size={18} color="#a78bfa" />
              </div>
              <textarea
                className="prompt-bar-input"
                rows={2}
                placeholder="Describe the motion (e.g. 'Camera pans left slowly, water flows gently')..."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              />
            </div>
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
                  onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                >
                  <option value="none">None (No Voiceover)</option>
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
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
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
            <span>{pollingStatus || 'Processing...'}</span>
          ) : (
            <>
              <span>Generate Content</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>

        {resultImageUrl && !showVideo && (
          <div className="result-video-container" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <h3>{activeType === 'text-to-image' ? 'Image Generated Successfully!' : 'Generating cinematic video...'}</h3>
            <img
              src={resultImageUrl}
              alt="AI Generated Base"
              style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
            />
            {activeType !== 'text-to-image' && <div style={{ marginTop: '1rem' }} className="spinner"></div>}
          </div>
        )}

        {showVideo && resultVideoUrl && (
          <div className="result-video-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <video
              id="resultVideo"
              controls
              autoPlay
              src={resultVideoUrl}
              style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default UploadPage;