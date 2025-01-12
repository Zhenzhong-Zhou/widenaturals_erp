const helmet = require('helmet');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Helmet middleware configuration
 *
 * @param {boolean} isProduction - Indicates if the environment is production
 * @returns {Function} - Configured Helmet middleware
 */
const configureHelmet = (isProduction) => {
  try {
    return helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"], // Allow resources from the same origin
              scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts only in production
              styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
              imgSrc: ["'self'", 'data:'], // Allow images from the same origin and data URIs
              connectSrc: ["'self'", 'https://api.example.com'], // Allow connections to specific APIs
              fontSrc: [
                "'self'",
                'https://fonts.googleapis.com',
                'https://fonts.gstatic.com',
              ], // Allow fonts
              objectSrc: ["'none'"], // Disallow object elements
              frameSrc: ["'none'"], // Disallow frames
              upgradeInsecureRequests: [], // Enforce HTTPS
            },
          }
        : false, // Disable CSP in development
      crossOriginEmbedderPolicy: true, // Mitigate Spectre-like vulnerabilities
      crossOriginOpenerPolicy: { policy: 'same-origin' }, // Enhance isolation for the browser
      crossOriginResourcePolicy: { policy: 'same-origin' }, // Restrict resource sharing
      dnsPrefetchControl: { allow: false }, // Disable DNS prefetching
      frameguard: { action: 'deny' }, // Prevent clickjacking
      hidePoweredBy: true, // Hide the X-Powered-By header
      hsts: isProduction
        ? {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true, // Apply to subdomains
            preload: true, // Preload in HSTS preload list
          }
        : false, // Disable HSTS in development
      ieNoOpen: true, // Prevent MIME-sniffing
      noSniff: true, // Prevent content type sniffing
      referrerPolicy: { policy: 'no-referrer' }, // Hide the Referer header
      xssFilter: true, // Add X-XSS-Protection header
    });
  } catch (error) {
    logError('Helmet configuration error:', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
    throw AppError.serviceError('Failed to configure security headers.', {
      details: error.message,
    });
  }
};

module.exports = configureHelmet;
