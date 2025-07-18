const { loadEnv } = require('../config/env');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { logError } = require('./logger-helper');
const { logSystemInfo } = require('./system-logger');
const AppError = require('./AppError');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

loadEnv();

const trustedIPs = process.env.TRUSTED_IPS
  ? process.env.TRUSTED_IPS.split(',')
  : [];

/**
 * Default custom handler for rate-limited requests.
 * Logs rate-limit violations and forwards a structured AppError to the error handler.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {Function} next - The next middleware function in the stack.
 * @param {object} options - Rate limiter options, including windowMs used to calculate retry delay.
 */
const defaultRateLimitHandler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  const clientKey = options.keyGenerator ? options.keyGenerator(req) : req.ip;

  // Set Retry-After header (in seconds)
  res.set('Retry-After', retryAfter.toString());

  // Log the rate limit event
  logError('Rate limit exceeded', req, {
    context: 'rate-limiter',
    retryAfter,
    maxRequests: options.max,
    clientKey,
  });

  // Return a structured JSON response using AppError
  next(
    AppError.rateLimitError(
      'You have exceeded the allowed number of requests. Please try again later.',
      retryAfter,
      {
        details: {
          ip: req.ip,
          method: req.method,
          route: req.originalUrl,
          userAgent: req.headers['user-agent'] || 'Unknown',
          retryAfter,
          clientKey,
        },
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
  keyGenerator = ipKeyGenerator,
  skip = (req) => trustedIPs.includes(req.ip),
  handler = defaultRateLimitHandler, // Use the default handler if none is provided
  disableInDev = false,
  context = 'rate-limiter',
} = {}) => {
  if (disableInDev && process.env.NODE_ENV === 'development') {
    logSystemInfo('Rate limiter disabled in development mode.', {
      context,
      windowMs,
      max,
    });
    // Bypass rate limiting in development mode
    return (req, res, next) => next();
  }

  logSystemInfo('Rate limiter initialized.', {
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
    legacyHeaders: false,
    statusCode,
    keyGenerator,
    skip,
    handler,
  });
};

module.exports = { createRateLimiter };
