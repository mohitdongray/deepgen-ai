/**
 * Preview Page
 * 
 * Displays the generated video result with:
 * - Status polling during generation
 * - Video player for completed results
 * - AI-Generated badge for transparency
 * - Download option
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Loader from '../../components/common/Loader/Loader';
import AIGeneratedBadge from '../../components/features/AIGeneratedBadge/AIGeneratedBadge';
import GenerationProgress from '../../components/features/GenerationProgress/GenerationProgress';
import { useJobStatus } from '../../hooks/useJobStatus';
import { resolveMediaUrl } from '../../services/generationService';
import './Preview.css';

const Preview = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { status, result, error, pollCount } = useJobStatus(jobId);

  const videoSrc = resolveMediaUrl(result?.video_url || result?.videoUrl);

  const handleDownload = () => {
    if (videoSrc) {
      const link = document.createElement('a');
      link.href = videoSrc;
      link.download = `ai-generated-${jobId}.mp4`;
      link.click();
    }
  };

  return (
    <div className="preview-page">
      <button className="back-btn" onClick={() => navigate('/workspace')}>
        <ArrowLeft size={18} />
        Create Another
      </button>

      <div className="preview-header">
        <h1>Video Preview</h1>
        <p>Job ID: {jobId}</p>
      </div>

      {status === 'pending' || status === 'processing' ? (
        <div className="processing-section">
          <Loader size="large" />
          <GenerationProgress 
            status={status} 
            pollCount={pollCount}
            estimatedTime={120} // 2 minutes estimated
          />
        </div>
      ) : status === 'failed' ? (
        <div className="error-section">
          <AlertCircle size={48} className="error-icon" />
          <h2>Generation Failed</h2>
          <p>{error || 'An unexpected error occurred.'}</p>
          <button className="retry-btn" onClick={() => navigate('/workspace')}>
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      ) : (
        <div className="result-section">
          <div className="video-container">
            <AIGeneratedBadge />
            <video 
              controls 
              src={videoSrc} 
              className="result-video"
            />
          </div>

          <div className="result-info">
            <div className="info-card">
              <h3>Generation Details</h3>
              <div className="info-row">
                <span>Status</span>
                <span className="status-success">Completed</span>
              </div>
              <div className="info-row">
                <span>Processing Time</span>
                <span>{result?.processingTime || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span>AI Provider</span>
                <span>{result?.provider || 'External API'}</span>
              </div>
            </div>

            <div className="disclaimer-card">
              <AlertCircle size={20} />
              <p>
                This video was generated using AI technology. It is your 
                responsibility to use this content ethically and in compliance 
                with all applicable laws and platform policies.
              </p>
            </div>

            <button className="download-btn" onClick={handleDownload}>
              <Download size={18} />
              Download Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
