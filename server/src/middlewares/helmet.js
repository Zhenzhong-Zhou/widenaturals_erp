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
            scriptSrc: ["'self'"], // Avoid inline scripts in production
            styleSrc: ["'self'"], // Avoid inline styles in production
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
        : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts only in development
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles only in development
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", 'https://api.example.com'],
            fontSrc: [
              "'self'",
              'https://fonts.googleapis.com',
              'https://fonts.gstatic.com',
            ],
            objectSrc: ["'none'"],
            frameSrc: ["'none'"],
          },
        }, // Relaxed CSP in development
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
