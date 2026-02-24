/**
 * Video Generation Service
 * 
 * Handles all video-related API communication:
 * - Initiate video generation (POST /generate-video)
 * - Check job status (GET /video-status/{id})
 * - Fetch completed videos
 * - Generate content with AI (POST /generate)
 * 
 * Architecture: Frontend → Node.js Gateway → Python Service → External AI API
 */

import api from './api';

export const initiateVideoGeneration = async (formData) => {
  const response = await api.post('/generate-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return response.data;
};

export const getVideoStatus = async (jobId) => {
  const response = await api.get(`/video-status/${jobId}`);
  return response.data;
};

export const fetchVideoResult = async (jobId) => {
  const response = await api.get(`/video-result/${jobId}`);
  return response.data;
};

// 🚀 NEW: Generate content with AI
export const generateVideo = async (prompt) => {
  const response = await api.post("/generate", {
    prompt: prompt
  });

  return response.data;
};
