/**
 * Video Routes
 * 
 * Handles video generation and status endpoints.
 * Routes requests to Python AI service after validation.
 * 
 * Endpoints:
 * - POST /generate-video: Initiates video generation
 * - GET /video-status/:id: Checks generation status
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Import middleware
const { videoGenerationLimiter, statusLimiter } = require('../middleware/rateLimiter');
const { validateVideoGeneration, handleValidationErrors, validateFileUpload } = require('../middleware/requestValidator');

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Python AI service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /generate-video
 * Initiates video generation
 * - Rate limited: 5 per hour
 * - Validates files and consent
 * - Forwards to Python service
 */
router.post(
  '/generate-video',
  videoGenerationLimiter,
  upload.fields([
    { name: 'sourceImage', maxCount: 1 },
    { name: 'targetVideo', maxCount: 1 }
  ]),
  validateFileUpload,
  validateVideoGeneration,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const jobId = uuidv4();
      
      // Forward request to Python AI service
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Add files
      const fs = require('fs');
      formData.append('source_image', fs.createReadStream(req.files.sourceImage[0].path));
      formData.append('target_video', fs.createReadStream(req.files.targetVideo[0].path));
      formData.append('mode', 'video');
      
      if (req.body.description) {
        formData.append('description', req.body.description);
      } else {
        formData.append('description', 'Default description');
      }

      // Call Python service
      const response = await axios.post(
        `${PYTHON_SERVICE_URL}/generate`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000 // 30 second timeout for initial request
        }
      );

      res.status(202).json({
        message: 'Video generation started',
        jobId: response.data.job_id,
        status: 'pending',
        estimatedTime: '2-3 minutes'
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /video-status/:id
 * Checks status of video generation job
 * - Rate limited: 60 per minute
 */
router.get(
  '/video-status/:id',
  statusLimiter,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Query Python service for status
      const response = await axios.get(
        `${PYTHON_SERVICE_URL}/status/${id}`,
        { timeout: 5000 }
      );

      res.json(response.data);

    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: 'Job not found',
          message: 'No video generation job found with this ID'
        });
      }
      next(error);
    }
  }
);

module.exports = router;
