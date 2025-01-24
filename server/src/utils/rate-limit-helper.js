const { loadEnv } = require('../config/env');
const rateLimit = require('express-rate-limit');
const { logWarn } = require('./logger-helper');
const AppError = require('./AppError');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

loadEnv();

const trustedIPs = process.env.TRUSTED_IPS
  ? process.env.TRUSTED_IPS.split(',')
  : [];

/**
 * Default custom handler for rate-limited requests.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const defaultRateLimitHandler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  const logDetails = {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
    method: req.method,
    route: req.originalUrl,
    retryAfter,
  };

  // Log the rate limit event
  logWarn('Rate limit exceeded:', {
    timestamp: new Date().toISOString(),
    ...logDetails,
  });

  // Return a structured JSON response using AppError
  next(
    AppError.rateLimitError(
      'You have exceeded the allowed number of requests. Please try again later.',
      retryAfter,
      {
        details: logDetails,
      }
    )
  );
};

/**
 * Creates a rate limiter with reusable defaults and customizable options.
 *
 * @param {Object} options - Configuration options for rate limiting.
 * @param {number} [options.windowMs=RATE_LIMIT.DEFAULT_WINDOW_MS] - Time window in milliseconds.
 * @param {number} [options.max=RATE_LIMIT.DEFAULT_MAX] - Maximum number of requests allowed in the time window.
 * @param {boolean} [options.headers=true] - Include rate limit headers in responses.
 * @param {number} [options.statusCode=429] - HTTP status code for rate limit exceeded.
 * @param {Function} [options.keyGenerator=(req) => req.ip] - Function to identify clients (default: IP).
 * @param {Function} [options.skip=() => false] - Function to skip rate limiting for certain requests.
 * @param {Function} [options.handler=defaultRateLimitHandler] - Custom handler for rate-limited responses.
 * @param {boolean} [options.disableInDev=false] - Disable rate limiting in development mode.
 * @returns {Function} - Middleware for rate limiting.
 */
const createRateLimiter = ({
  windowMs = process.env.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
    : RATE_LIMIT.DEFAULT_WINDOW_MS,
  max = process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : RATE_LIMIT.DEFAULT_MAX,
  headers = true,
  statusCode = 429,
  keyGenerator = (req) => req.ip,
  skip = (req) => trustedIPs.includes(req.ip),
  handler = defaultRateLimitHandler, // Use default handler if none is provided
  disableInDev = false,
} = {}) => {
  if (disableInDev && process.env.NODE_ENV === 'development') {
    // Bypass rate limiting in development mode
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: headers,
    legacyHeaders: false,
    statusCode,
    keyGenerator,
    skip,
    handler,
  });
};

module.exports = { createRateLimiter };
