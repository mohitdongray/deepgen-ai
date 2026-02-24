/**
 * Request Validator Middleware
 * 
 * Validates incoming requests using express-validator.
 * Ensures:
 * - Files are proper format and size
 * - Consent checkbox is confirmed
 * - No malicious input
 */

const { body, validationResult } = require('express-validator');

// Validation rules for video generation
const validateVideoGeneration = [
  body('consentConfirmed')
    .exists()
    .isIn(['true', 'True', '1'])
    .withMessage('You must confirm consent to proceed'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters')
    .trim()
    .escape() // Prevent XSS
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.files || !req.files.sourceImage || !req.files.targetVideo) {
    return res.status(400).json({
      error: 'Missing files',
      message: 'Both source image and target video are required'
    });
  }

  const { sourceImage, targetVideo } = req.files;

  // Validate image
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedImageTypes.includes(sourceImage.mimetype)) {
    return res.status(400).json({
      error: 'Invalid image format',
      message: 'Source image must be JPEG or PNG'
    });
  }

  if (sourceImage.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      error: 'Image too large',
      message: 'Source image must be under 10MB'
    });
  }

  // Validate video
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi'];
  if (!allowedVideoTypes.includes(targetVideo.mimetype)) {
    return res.status(400).json({
      error: 'Invalid video format',
      message: 'Target video must be MP4, MOV, or AVI'
    });
  }

  if (targetVideo.size > 100 * 1024 * 1024) {
    return res.status(400).json({
      error: 'Video too large',
      message: 'Target video must be under 100MB'
    });
  }

  next();
};

module.exports = {
  validateVideoGeneration,
  handleValidationErrors,
  validateFileUpload
};
