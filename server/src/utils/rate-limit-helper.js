const rateLimit = require('express-rate-limit');
const { logWarn } = require('./logger-helper');
const AppError = require('../utils/app-error');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Default custom handler for rate-limited requests.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const defaultRateLimitHandler = (req, res, next) => {
  const logDetails = {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
    method: req.method,
    route: req.originalUrl,
  };
  
  // Log the rate limit event
  logWarn('Rate limit exceeded:', logDetails);
  
  // Use AppError for structured error response
  const rateLimitError = new AppError(
    'You have exceeded the allowed number of requests. Please try again later.',
    429,
    { type: 'RateLimitError', isExpected: true }
  );
  
  next(rateLimitError);
};

/**
 * Creates a rate limiter with reusable defaults and customizable options.
 *
 * @param {Object} options - Configuration options for rate limiting.
 * @param {number} options.windowMs - Time window in milliseconds.
 * @param {number} options.max - Maximum number of requests allowed in the time window.
 * @param {boolean} [options.headers] - Include rate limit headers in responses.
 * @param {number} [options.statusCode] - HTTP status code for rate limit exceeded.
 * @param {Function} [options.keyGenerator] - Function to identify clients (default: IP).
 * @param {Function} [options.skip] - Function to skip rate limiting for certain requests.
 * @param {Function} [options.handler] - Custom handler for rate-limited responses.
 * @param {boolean} [options.disableInDev] - Disable rate limiting in development mode.
 * @returns {Function} - Middleware for rate limiting.
 */
const createRateLimiter = ({
                             windowMs = RATE_LIMIT.DEFAULT_WINDOW_MS,
                             max = RATE_LIMIT.DEFAULT_MAX,
                               //todo
                             // windowMs = process.env.RATE_LIMIT_WINDOW_MS
                             //   ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
                             //   : RATE_LIMIT.DEFAULT_WINDOW_MS,
                             // max = process.env.RATE_LIMIT_MAX
                             //   ? parseInt(process.env.RATE_LIMIT_MAX, 10)
                             //   : RATE_LIMIT.DEFAULT_MAX,
                             headers = true,
                             statusCode = 429,
                             keyGenerator = (req) => req.ip,
                             skip = () => false,
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
