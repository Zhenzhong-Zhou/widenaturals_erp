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
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.CSRF_TESTING !== true
  ) {
    return true; // Bypass CSRF in development unless explicitly testing
  }

  const exemptMethods = ['HEAD', 'OPTIONS']; // Read-only methods
  const exemptPaths = process.env.CSRF_EXEMPT_PATHS
    ? process.env.CSRF_EXEMPT_PATHS.split(',')
    : [
        `${process.env.API_PREFIX}/public`, // Example: Public APIs
        `${process.env.API_PREFIX}/session/login`, // Example: Login endpoint
      ];
  
  if (exemptMethods.includes(req.method) || exemptPaths.some((path) => req.path.startsWith(path))) {
    logWarn(`CSRF validation bypassed for ${req.method} ${req.path}`);
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
    // Allow token generation for non-state-changing requests like GET
    if (req.method === 'GET' && req.path === `${process.env.API_PREFIX}/csrf/token`) {
      return csrfMiddleware(req, res, next);
    }
    
    if (shouldBypassCSRF(req)) {
      logWarn(`CSRF bypassed for ${req.method} ${req.path}`);
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
          details: error.message,
        })
      );
    }
  };
};

module.exports = {
  csrfProtection,
};
