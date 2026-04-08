/**
 * @file rate-limit-helper.js
 * @description Generic rate limiter factory used by all route-specific
 * rate limiter middleware in `middlewares/rate-limiter.js`.
 *
 * Responsibilities:
 *   - Provide a reusable `createRateLimiter` factory with sensible defaults
 *   - Handle trusted IP bypass via `TRUSTED_IPS` env var
 *   - Provide a consistent rate-limit violation handler with structured logging
 *   - Support development mode bypass via `disableInDev`
 *
 * Environment variables:
 *   TRUSTED_IPS            — comma-separated IPs that bypass all rate limiters
 *   RATE_LIMIT_WINDOW_MS   — default window override (optional)
 *   RATE_LIMIT_MAX         — default max requests override (optional)
 */

'use strict';

const rateLimit        = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { getClientIp }    = require('./request-context');
const { logWarn }        = require('./logging/logger-helper');
const { logSystemInfo }  = require('./logging/system-logger');
const AppError           = require('./AppError');
const RATE_LIMIT         = require('../utils/constants/domain/rate-limit');

const CONTEXT = 'utils/rate-limit-helper';

// -----------------------------------------------------------------------------
// Trusted IPs — resolved once at module load
// Stored as a Set for O(1) lookup on every request.
// -----------------------------------------------------------------------------

/**
 * Set of IP addresses that bypass all rate limiters.
 * Populated from the TRUSTED_IPS environment variable.
 *
 * @type {Set<string>}
 */
const TRUSTED_IPS = new Set(
  process.env.TRUSTED_IPS
    ? process.env.TRUSTED_IPS.split(',').map((ip) => ip.trim()).filter(Boolean)
    : []
);

// -----------------------------------------------------------------------------
// Default window and max — resolved once at module load
// Reading process.env inside a destructuring default runs on every call.
// -----------------------------------------------------------------------------

const DEFAULT_WINDOW_MS =
  process.env.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
    : RATE_LIMIT.DEFAULT_WINDOW_MS;

const DEFAULT_MAX =
  process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : RATE_LIMIT.DEFAULT_MAX;

// -----------------------------------------------------------------------------
// Default violation handler
// -----------------------------------------------------------------------------

/**
 * Handles requests that have exceeded the rate limit.
 *
 * Sets a `Retry-After` header, logs the violation as a warning (not an error —
 * rate limiting is expected behaviour under normal traffic patterns), and
 * forwards a structured `AppError` to the Express error handler.
 *
 * Request metadata (IP, route, user-agent) is placed in `meta` rather than
 * `details` — it is observability data for logs, not client-facing context.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @param {object} options - Rate limiter options passed by express-rate-limit.
 * @param {number} options.windowMs - Window duration in milliseconds.
 * @param {number} options.max - Maximum requests allowed in the window.
 * @param {Function} [options.keyGenerator] - Client key generator function.
 * @returns {void}
 */
const defaultRateLimitHandler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  const clientKey  = options.keyGenerator
    ? options.keyGenerator(req)
    : getClientIp(req);
  
  // Inform the client when it may retry.
  res.set('Retry-After', String(retryAfter));
  
  // Rate limiting is expected behaviour — log as warn, not error.
  logWarn('Rate limit exceeded', req, {
    context:     CONTEXT,
    retryAfter,
    maxRequests: options.max,
    clientKey,
    method:      req.method,
    route:       req.originalUrl,
    userAgent:   req.get('user-agent') ?? 'unknown',
  });
  
  next(
    AppError.rateLimitError(
      'Too many requests. Please try again later.',
      { details: { retryAfter } }
    )
  );
};

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

/**
 * Creates a configured `express-rate-limit` middleware instance.
 *
 * `ipKeyGenerator` from `express-rate-limit` is used as the default key
 * generator instead of plain `req.ip` because it correctly respects the
 * `trust proxy` setting configured in `app.js`, ensuring the real client IP
 * is used behind NGINX or a load balancer.
 *
 * @param {object} [options={}] - Rate limiter configuration.
 * @param {number} [options.windowMs=DEFAULT_WINDOW_MS] - Time window in ms.
 * @param {number} [options.max=DEFAULT_MAX] - Max requests per window.
 * @param {boolean} [options.headers=true] - Include standard rate limit headers.
 * @param {number} [options.statusCode=429] - HTTP status for limited responses.
 * @param {Function} [options.keyGenerator=ipKeyGenerator] - Client identifier function.
 * @param {Function} [options.skip] - Return `true` to bypass limiting for a request.
 *   Defaults to skipping requests from `TRUSTED_IPS`.
 * @param {Function} [options.handler=defaultRateLimitHandler] - Violation handler.
 * @param {boolean} [options.disableInDev=false] - When `true`, sets max to
 *   `Number.MAX_SAFE_INTEGER` in development so limits are effectively disabled.
 * @param {string} [options.context='rate-limiter'] - Label used in log entries.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
const createRateLimiter = ({
                             windowMs    = DEFAULT_WINDOW_MS,
                             max         = DEFAULT_MAX,
                             headers     = true,
                             statusCode  = 429,
                             keyGenerator = ipKeyGenerator,
                             skip = (req) => TRUSTED_IPS.has(getClientIp(req)),
                             handler     = defaultRateLimitHandler,
                             disableInDev = false,
                             context     = 'rate-limiter',
                           } = {}) => {
  // In development with disableInDev, set max to MAX_SAFE_INTEGER rather than
  // skipping the middleware entirely — this keeps the middleware in the chain
  // (preserving headers and key generation) while effectively removing the limit.
  if (disableInDev && process.env.NODE_ENV === 'development') {
    logSystemInfo('Rate limiter disabled in development', {
      context,
      windowMs,
      max,
    });
    
    return rateLimit({
      windowMs,
      max:             Number.MAX_SAFE_INTEGER,
      standardHeaders: headers,
      legacyHeaders:   false,
    });
  }
  
  logSystemInfo('Rate limiter initialized', {
    context,
    windowMs,
    max,
    statusCode,
    headers,
  });
  
  return rateLimit({
    windowMs,
    max,
    standardHeaders: headers,
    legacyHeaders:   false,
    statusCode,
    keyGenerator,
    skip,
    handler,
  });
};

module.exports = {
  createRateLimiter
};
