/**
 * @file csrf-protection.js
 * @description CSRF protection middleware using `csurf`.
 * Ensures requests are protected against Cross-Site Request Forgery attacks.
 *
 * Usage:
 * - Import and configure this middleware in your Express app.
 * - Use in conjunction with a session or cookie parser.
 */

const { loadEnv } = require('../config/env');
const csrf = require('csurf');
const { logWarn, logError } = require('../utils/logger-helper');
const { ONE_HOUR } = require('../utils/constants/general/time');
const AppError = require('../utils/AppError');

loadEnv();

// Configure CSRF Middleware
const csrfMiddleware = csrf({
  cookie: {
    httpOnly: true, // Prevent client-side access to the cookie (enhances security)
    secure: process.env.COOKIE_SECURE === 'true', // Use secure cookies in production
    sameSite: process.env.COOKIE_SAMESITE || 'strict', // Enforce same-site policy
    maxAge: parseInt(process.env.CSRF_COOKIE_MAXAGE, 10) || ONE_HOUR, // Set cookie expiration
  },
});

/**
 * Determines if a request should bypass CSRF protection.
 * Allows bypassing for specific methods or paths.
 *
 * @param {object} req - The Express request object.
 * @returns {boolean} - Whether to bypass CSRF validation.
 */
const shouldBypassCSRF = (req) => {
  // Allow bypass in development for testing purposes
  if (process.env.NODE_ENV === 'development' && process.env.CSRF_TESTING === 'true') {
    return true;
  }
  
  // Define exempt methods and paths
  const exemptMethods = ['HEAD', 'OPTIONS']; // Only include non-state-changing methods
  const exemptPaths = [
    `${process.env.API_PREFIX}/public`, // Public APIs
    `${process.env.API_PREFIX}/csrf/token`, // CSRF token generation
  ];
  
  // Allow exempt methods or explicitly exempt paths
  if (exemptMethods.includes(req.method) || (req.method === 'GET' && exemptPaths.includes(req.path))) {
    logWarn(`CSRF validation bypassed for ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return true;
  }
  
  return false;
};

/**
 * CSRF protection middleware.
 * Configures and applies CSRF protection for secure routes.
 *
 * @returns {function} - Middleware function for CSRF protection.
 */
const csrfProtection = () => {
  return (req, res, next) => {
    if (shouldBypassCSRF(req)) {
      return next(); // Skip CSRF validation
    }
    
    try {
      csrfMiddleware(req, res, next);
    } catch (error) {
      logError('CSRF Middleware Error:', {
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      });
      next(
        AppError.csrfError('CSRF token validation failed.', {
          details: process.env.NODE_ENV !== 'production' ? error.message : null,
        })
      );
    }
  };
};

module.exports = {
  csrfProtection,
};
