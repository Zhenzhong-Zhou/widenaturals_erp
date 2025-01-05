const rateLimit = require('express-rate-limit');
const { logWarn } = require('./loggerHelper');
const RATE_LIMIT = require('../utils/constants/domain/rate-limit');

/**
 * Creates a rate limiter with reusable defaults and customizable options.
 * @param {Object} options - Configuration options for rate limiting.
 * @param {number} options.windowMs - Time window in milliseconds.
 * @param {number} options.max - Maximum number of requests allowed in the time window.
 * @param {string} [options.message] - Error message for rate-limited responses.
 * @param {boolean} [options.headers] - Include rate limit headers in responses.
 * @param {number} [options.statusCode] - HTTP status code for rate limit exceeded.
 * @param {Function} [options.keyGenerator] - Function to identify clients (default: IP).
 * @param {Function} [options.skip] - Function to skip rate limiting for certain requests.
 * @param {Function} [options.handler] - Custom handler for rate-limited responses.
 * @returns {Function} - Middleware for rate limiting.
 */
const createRateLimiter = ({
                             windowMs = RATE_LIMIT.DEFAULT_WINDOW_MS,
                             max = RATE_LIMIT.DEFAULT_MAX,
                             message = RATE_LIMIT.DEFAULT_MESSAGE,
                             headers = true,
                             statusCode = 429,
                             keyGenerator = (req) => req.ip,
                             skip = () => false,
                             handler = (req, res) => {
                               logWarn(`Rate limit exceeded for ${req.ip} for ${req.originalUrl}`);
                               res.status(statusCode).json({ message });
                             },
                           } = {}) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: headers,
    legacyHeaders: false,
    statusCode,
    keyGenerator,
    skip,
    handler,
  });
};

module.exports = { createRateLimiter };
