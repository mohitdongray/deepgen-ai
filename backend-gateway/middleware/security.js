/**
 * Security Headers Middleware
 * 
 * Additional security headers beyond Helmet defaults.
 * Prevents common web vulnerabilities.
 */

const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy (disable unnecessary features)
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  next();
};

module.exports = securityHeaders;
