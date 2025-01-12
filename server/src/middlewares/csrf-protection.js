/**
 * @file csrf-protection.js
 * @description CSRF protection middleware using `csurf`.
 * Ensures requests are protected against Cross-Site Request Forgery attacks.
 *
 * Usage:
 * - Import and configure this middleware in your Express app.
 * - Use in conjunction with a session or cookie parser.
 */

const csrf = require('csurf');
const { logWarn, logError } = require('../utils/logger-helper');
const { ONE_HOUR } = require('../utils/constants/general/time');
const AppError = require('../utils/AppError');

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

  const exemptMethods = ['GET', 'HEAD', 'OPTIONS']; // Read-only methods
  const exemptPaths = process.env.CSRF_EXEMPT_PATHS
    ? process.env.CSRF_EXEMPT_PATHS.split(',')
    : [
        '/api/v1/public', // Example: Public APIs
        '/api/v1/auth/login', // Example: Login endpoint
      ];

  return (
    exemptMethods.includes(req.method) ||
    exemptPaths.some((path) => req.path.startsWith(path))
  );
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
      logWarn(`CSRF bypassed for ${req.method} ${req.path}`);
      return next(); // Skip CSRF validation
    }

    try {
      // Apply CSRF protection
      csrf({
        cookie: {
          httpOnly: true, // Prevent client-side scripts from accessing the cookie
          secure: process.env.COOKIE_SECURE === 'true', // Use secure cookies in production
          sameSite: process.env.COOKIE_SAMESITE || 'strict', // Enforce same-site policy
          maxAge: ONE_HOUR, // Default: 1 hour
        },
      })(req, res, next);
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

/**
 * Middleware to generate a CSRF token for frontend usage.
 * Supports sending tokens via headers or JSON response.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const csrfTokenHandler = (req, res, next) => {
  try {
    const csrfToken = req.csrfToken(); // Generate CSRF token
    const tokenTransportMethod = process.env.CSRF_TOKEN_TRANSPORT || 'header';

    if (tokenTransportMethod === 'header') {
      res.set('X-CSRF-Token', csrfToken);
    }

    res.json({ csrfToken });
  } catch (error) {
    logError('CSRF Token Generation Error:', {
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
    next(
      AppError.csrfError('Failed to generate CSRF token.', {
        details: error.message,
      })
    );
  }
};

module.exports = {
  csrfProtection,
  csrfTokenHandler,
};
