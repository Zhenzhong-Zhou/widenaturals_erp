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
const AppError = require('../utils/app-error');

/**
 * CSRF middleware configuration.
 * Uses cookies to securely store CSRF tokens.
 */
const csrfProtection = () => {
  // Skip CSRF for certain API paths or methods
  const shouldBypassCSRF = (req) => {
    if (process.env.NODE_ENV === 'development' && process.env.CSRF_TESTING !== 'true') {
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
  
  return (req, res, next) => {
    if (shouldBypassCSRF(req)) {
      logWarn(`CSRF bypassed for ${req.method} ${req.path}`);
      return next(); // Skip CSRF validation
    }
    
    try {
      // Apply CSRF protection for all other cases
      csrf({
        cookie: {
          httpOnly: true, // Prevent client-side scripts from accessing the cookie
          secure: process.env.COOKIE_SECURE === 'true', // Use secure cookies in production
          sameSite: process.env.COOKIE_SAMESITE || 'strict', // Enforce same-site policy
          maxAge: ONE_HOUR, // Default: 1 hour
        },
      })(req, res, next);
    } catch (error) {
      logError('CSRF Middleware Error:', error);
      next(new AppError('CSRF token validation failed', 403, { type: 'CSRFError' }));
    }
  };
};

/**
 * Generate CSRF token for frontend.
 * Supports sending tokens via headers or JSON response.
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
    logError('CSRF Token Generation Error:', error);
    next(new AppError('Failed to generate CSRF token', 500, { type: 'CSRFError' }));
  }
};

module.exports = {
  csrfProtection,
  csrfTokenHandler,
};
