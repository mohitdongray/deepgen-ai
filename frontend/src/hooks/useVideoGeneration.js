/**
 * Custom Hook: useVideoGeneration
 * 
 * Manages the complete video generation lifecycle:
 * - Form state management
 * - Upload handling with progress tracking
 * - Generation initiation with validation
 * - Error handling and user feedback
 * 
 * Ethics: Ensures consent checkbox is validated before submission
 */

import { useState, useCallback } from 'react';
import { initiateVideoGeneration } from '../services/videoService';

export const useVideoGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const generateVideo = useCallback(async (formData, hasConsent) => {
    // ETHICS CHECK: Validate user consent before processing
    if (!hasConsent) {
      setError('You must confirm you have permission to use this content.');
      return null;
    }

    // Validate required fields
    if (!formData.sourceImage || !formData.targetVideo) {
      setError('Please upload both source image and target video.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setProgress(10);

    try {
      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 80));
      }, 1000);

      const data = new FormData();
      data.append('sourceImage', formData.sourceImage);
      data.append('targetVideo', formData.targetVideo);
      data.append('consentConfirmed', hasConsent.toString());
      
      // Optional parameters
      if (formData.description) {
        data.append('description', formData.description);
      }

      const response = await initiateVideoGeneration(data);
      clearInterval(progressInterval);
      setProgress(100);

      return response.jobId;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start video generation. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generateVideo, isLoading, error, progress };
};
