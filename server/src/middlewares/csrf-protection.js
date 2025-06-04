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
const csrf = require('@dr.pogodin/csurf');
const { logError } = require('../utils/logger-helper');
const { logSystemInfo } = require('../utils/system-logger');
const { ONE_HOUR } = require('../utils/constants/general/time');
const AppError = require('../utils/AppError');

loadEnv();

/**
 * Creates configured CSRF middleware using environment-based cookie options.
 *
 * @returns {Function} Express middleware for CSRF protection.
 */
const createCsrfMiddleware = () => {
  // Configure CSRF cookie behavior for security and session consistency
  const csrfCookieOptions = {
    httpOnly: true, // Prevent client-side access to the cookie (enhances security)
    secure: process.env.COOKIE_SECURE === 'true', // Use secure cookies in production
    sameSite: process.env.COOKIE_SAMESITE || 'strict', // Enforce same-site policy
    maxAge: parseInt(process.env.CSRF_COOKIE_MAXAGE, 10) || ONE_HOUR, // Set cookie expiration
  };
  
  // Log the resolved CSRF cookie configuration for traceability and debugging
  logSystemInfo('Initialized CSRF middleware with cookie settings.', {
    context: 'csrf-protection',
    cookie: csrfCookieOptions,
  });
  
  // Create the CSRF middleware instance using the configured cookie policy
  return csrf({ cookie: csrfCookieOptions });
};

// Initialize CSRF middleware once at module level with secure cookie settings.
// Used globally to enforce CSRF protection with standardized logging and environment-aware configuration.
const csrfMiddleware = createCsrfMiddleware();

/**
 * Determines if a request should bypass CSRF protection.
 * Allows bypassing for specific methods or paths.
 *
 * @param {object} req - The Express request object.
 * @returns {boolean} - Whether to bypass CSRF validation.
 */
const shouldBypassCSRF = (req) => {
  // Allow bypass in development for testing purposes
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.CSRF_TESTING === 'true'
  ) {
    logSystemInfo('CSRF bypassed for development testing.', {
      context: 'csrf-protection',
    });
    return true;
  }

  // Define exempt methods and paths
  const exemptMethods = ['HEAD', 'OPTIONS']; // Only include non-state-changing methods
  const exemptPaths = [
    `${process.env.API_PREFIX}/public`, // Public APIs
  ];

  // Allow exempt methods or explicitly exempt paths
  if (
    exemptMethods.includes(req.method) ||
    (req.method === 'GET' && exemptPaths.includes(req.path))
  ) {
    logError('CSRF validation bypassed', req, {
      context: 'csrf-protection',
      reason: exemptMethods.includes(req.method) ? 'exempt method' : 'exempt path',
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
      logError(error, req, {
        context: 'csrf-protection',
        stage: 'token-validation',
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
  csrfMiddleware,
};
