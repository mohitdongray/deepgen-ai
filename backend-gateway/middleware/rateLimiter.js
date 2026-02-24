/**
 * Rate Limiting Middleware
 * 
 * Prevents API abuse by limiting requests:
 * - Video generation: 5 requests per hour per IP (expensive operation)
 * - Status checks: 60 requests per minute (polling)
 * - General API: 100 requests per minute
 * 
 * Uses in-memory store for simplicity in educational project.
 * Production would use Redis.
 */

const rateLimit = require('express-rate-limit');

// Strict limit for video generation (expensive AI calls)
const videoGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    error: 'Too many video generation requests',
    message: 'Please wait before generating another video. Maximum 5 generations per hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting (only count actual attempts)
  skipSuccessfulRequests: false,
  // Custom key generator (IP-based)
  keyGenerator: (req) => req.ip
});

// Status polling limiter (more lenient)
const statusLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 status checks per minute
  message: {
    error: 'Too many status requests',
    message: 'Please reduce polling frequency.'
  }
});

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    message: 'API rate limit exceeded. Please slow down.'
  }
});

module.exports = {
  videoGenerationLimiter,
  statusLimiter,
  generalLimiter
};
