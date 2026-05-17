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


// 🚀 Generate content with AI — calls /generate (FormData) then polls /status
export const generateVideo = async (prompt, mode = "image") => {
  // Step 1: Submit generation request with FormData
  const formData = new FormData();
  formData.append("description", prompt);
  formData.append("mode", mode);

  const submitRes = await api.post("/generate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const { job_id } = submitRes.data;
  if (!job_id) {
    throw new Error("No job_id returned from /generate");
  }

  // Step 2: Poll /status/{job_id} until completed or failed
  const maxRetries = 60; // 60 x 2s = 2 minutes max
  const pollInterval = 2000; // 2 seconds

  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const statusRes = await api.get(`/status/${job_id}`);
    const job = statusRes.data;

    if (job.status === "completed") {
      // Return in the shape the UI expects
      return {
        status: "success",
        image_url: job.image_url || job.video_url,
        video_url: job.video_url,
        provider: job.provider || "huggingface",
        request_id: job_id,
        job_id,
      };
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Generation failed");
    }

    // Still processing — keep polling
  }

  throw new Error("Generation timed out after 2 minutes");
};
