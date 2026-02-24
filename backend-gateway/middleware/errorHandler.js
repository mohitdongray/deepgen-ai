/**
 * Centralized Error Handler
 * 
 * Catches all errors and returns consistent error responses.
 * Prevents leaking internal details to frontend.
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Uploaded file exceeds size limit'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong. Please try again.',
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
