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
const AppError = require('../utils/AppError');

loadEnv();

/**
 * Creates a CSRF protection middleware with environment-driven cookie configuration.
 *
 * This function encapsulates:
 * - Secure cookie policy resolution (httpOnly, secure, sameSite)
 * - Initialization logging for observability
 * - Adaptation of third-party middleware (`@dr.pogodin/csurf`) into a
 *   standard Express RequestHandler to resolve type incompatibilities
 *
 * NOTE:
 * `@dr.pogodin/csurf` uses its own internal Express type references, which
 * are not directly compatible with the application's `@types/express`.
 * A lightweight adapter is used to normalize the middleware signature.
 *
 * @returns {import('express').RequestHandler}
 * Express middleware enforcing CSRF protection via cookie-based tokens.
 */
const createCsrfMiddleware = () => {
  //------------------------------------------------------------
  // Resolve CSRF cookie configuration from environment
  //------------------------------------------------------------
  const csrfCookieOptions = /** @type {import('@dr.pogodin/csurf').CookieOptions} */ ({
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: /** @type {'strict' | 'lax' | 'none'} */ (
      process.env.COOKIE_SAMESITE === 'lax'
        ? 'lax'
        : process.env.COOKIE_SAMESITE === 'none'
          ? 'none'
          : 'strict'
    ),
  });
  
  //------------------------------------------------------------
  // Log resolved configuration for debugging and traceability
  //------------------------------------------------------------
  logSystemInfo('Initialized CSRF middleware with cookie settings.', {
    context: 'csrf-protection',
    cookie: csrfCookieOptions,
  });
  
  //------------------------------------------------------------
  // Initialize CSRF middleware from external library
  //------------------------------------------------------------
  const middleware = csrf({ cookie: csrfCookieOptions });
  
  //------------------------------------------------------------
  // Adapt middleware to Express RequestHandler
  //
  // WHY:
  // - Avoid type mismatch between library and app-level Express types
  // - Safely isolate `any` usage at the integration boundary
  //------------------------------------------------------------
  return /** @type {import('express').RequestHandler} */ (
    (req, res, next) =>
      middleware(
        /** @type {any} */ (req),
        /** @type {any} */ (res),
        /** @type {any} */ (next)
      )
  );
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
      reason: exemptMethods.includes(req.method)
        ? 'exempt method'
        : 'exempt path',
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
