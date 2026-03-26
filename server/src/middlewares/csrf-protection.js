/**
 * @file csrf-protection.js
 * @description CSRF protection middleware using `@dr.pogodin/csurf`.
 *
 * Exports:
 *   - `csrfProtection` — middleware factory that applies CSRF validation,
 *     with bypass logic for exempt methods and paths.
 *   - `csrfMiddleware`  — the raw configured csurf instance, exported for
 *     use in the static file / uploads router where it is applied directly.
 *
 * How csurf errors are handled:
 *   `@dr.pogodin/csurf` signals token validation failures via next(err) with
 *   a raw CsrfError (err.code === 'EBADCSRFTOKEN'). This middleware intercepts
 *   that raw error and normalizes it to AppError.csrfError at the source
 *   before forwarding via next(appError). The downstream csrf-error-handler
 *   only needs to match, log, and respond — no normalization needed there.
 *
 * Type adapter note:
 *   `@dr.pogodin/csurf` uses its own internal Express type references that are
 *   not directly compatible with this project's `@types/express`. A lightweight
 *   cast adapter is used at the call site to isolate the `any` boundary.
 */

'use strict';

const csrf     = require('@dr.pogodin/csurf');
const AppError = require('../utils/AppError');
const { logWarn }       = require('../utils/logging/logger-helper');
const { logSystemInfo } = require('../utils/logging/system-logger');

const CONTEXT = 'middleware/csrf-protection';

// -----------------------------------------------------------------------------
// Cookie configuration — resolved once at module load
// -----------------------------------------------------------------------------

/**
 * CSRF cookie options derived from environment variables.
 * Resolved at module load so they are not re-evaluated per request.
 *
 * @type {import('@dr.pogodin/csurf').CookieOptions}
 */
const csrfCookieOptions = /** @type {import('@dr.pogodin/csurf').CookieOptions} */ ({
  httpOnly: true,
  secure:   process.env.COOKIE_SECURE === 'true',
  sameSite: /** @type {'strict' | 'lax' | 'none'} */ (
    process.env.COOKIE_SAMESITE === 'lax'
      ? 'lax'
      : process.env.COOKIE_SAMESITE === 'none'
        ? 'none'
        : 'strict'
  ),
});

logSystemInfo('CSRF middleware initialized', {
  context: CONTEXT,
  cookie:  csrfCookieOptions,
});

// -----------------------------------------------------------------------------
// csurf middleware instance — created once, reused across all requests
// -----------------------------------------------------------------------------

const _csrfInstance = csrf({ cookie: csrfCookieOptions });

/**
 * Type-adapted csurf middleware.
 *
 * Cast to `import('express').RequestHandler` to resolve the type
 * incompatibility between `@dr.pogodin/csurf`'s internal Express references
 * and this project's `@types/express`. All `any` usage is confined here.
 *
 * @type {import('express').RequestHandler}
 */
const csrfMiddleware = /** @type {import('express').RequestHandler} */ (
  (req, res, next) =>
    _csrfInstance(
      /** @type {any} */ (req),
      /** @type {any} */ (res),
      /** @type {any} */ (next)
    )
);

// -----------------------------------------------------------------------------
// Bypass configuration — resolved once at module load
// Rebuilding these on every request would allocate new arrays needlessly.
// -----------------------------------------------------------------------------

// HEAD and OPTIONS are safe methods that cannot carry state-changing intent,
// so they are unconditionally exempt from CSRF validation.
const EXEMPT_METHODS = new Set(['HEAD', 'OPTIONS']);

// Public API paths that do not require CSRF protection.
// Resolved here so process.env.API_PREFIX is read once.
const EXEMPT_PATHS = new Set([
  `${process.env.API_PREFIX}/public`,
]);

// -----------------------------------------------------------------------------
// Bypass logic
// -----------------------------------------------------------------------------

/**
 * Determines whether a request should skip CSRF validation.
 *
 * Bypass conditions (in priority order):
 *   1. Development testing mode (`CSRF_TESTING=true`) — bypasses all validation.
 *   2. Exempt HTTP method (HEAD, OPTIONS).
 *   3. GET request to an explicitly exempt path.
 *
 * @param {import('express').Request} req - Incoming Express request.
 * @returns {boolean} `true` if the request should skip CSRF validation.
 */
const shouldBypassCSRF = (req) => {
  // Development bypass — allows testing without a valid CSRF token.
  // Never active in production because NODE_ENV will not be 'development'.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.CSRF_TESTING === 'true'
  ) {
    logWarn('CSRF validation bypassed (CSRF_TESTING=true)', null, {
      context: CONTEXT,
    });
    
    // Stub req.csrfToken so downstream code that calls it doesn't crash.
    // Controllers and error handlers expect this function to exist regardless
    // of whether CSRF validation actually ran.
    req.csrfToken = () => 'csrf-bypass-token';
    
    return true;
  }
  
  // Exempt methods — safe by definition, no logging needed (very high volume).
  if (EXEMPT_METHODS.has(req.method)) {
    return true;
  }
  
  // Exempt GET paths — GET should be idempotent, but explicit path exemptions
  // are logged so unexpected bypass activity is visible in logs.
  if (req.method === 'GET' && EXEMPT_PATHS.has(req.path)) {
    logWarn('CSRF validation bypassed for exempt path', req, {
      context: CONTEXT,
      path:    req.path,
    });
    return true;
  }
  
  return false;
};

// -----------------------------------------------------------------------------
// CSRF protection middleware factory
// -----------------------------------------------------------------------------

/**
 * Express middleware factory that applies CSRF protection to state-changing
 * requests, with bypass logic for safe methods and exempt paths.
 *
 * Raw CsrfError objects from `@dr.pogodin/csurf` are intercepted here and
 * normalized to AppError.csrfError before being forwarded via next(appError).
 * This keeps all normalization at the source so downstream error handlers
 * only need to match, log, and respond.
 *
 * @returns {import('express').RequestHandler}
 */
const csrfProtection = () => {
  return (req, res, next) => {
    if (shouldBypassCSRF(req)) {
      next();
      return;
    }
    
    // Delegate to csurf with a custom next callback to intercept raw errors
    // before they reach the error handler pipeline.
    csrfMiddleware(req, res, (err) => {
      // No error — continue to the next middleware normally.
      if (!err) {
        next();
        return;
      }
      
      // EBADCSRFTOKEN is the only error code csurf emits for token failures.
      // Normalize it to AppError at the source so the error handler pipeline
      // always receives a consistently shaped AppError, never a raw csurf error.
      if (err.code === 'EBADCSRFTOKEN') {
        return next(
          AppError.csrfError('Invalid or missing CSRF token.', {
            // Request context captured here for observability.
            // toJSON() strips meta so it never reaches the client response.
            meta: {
              origin:   req.get('origin')  ?? null,
              referrer: req.get('referer') ?? null,
              method:   req.method,
              route:    req.originalUrl,
            },
          })
        );
      }
      
      // Unknown error from csurf — forward as-is so globalErrorHandler
      // can normalize and respond. Never swallow unexpected errors.
      next(err);
    });
  };
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  csrfProtection,
  csrfMiddleware,
};
