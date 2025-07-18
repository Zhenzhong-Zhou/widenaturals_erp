/**
 * @file rate-limit-error-handler.js
 * @description Middleware to handle rate limiting errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle rate limiting errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  const isRateLimitError =
    err.name === 'RateLimitError' ||
    err.message?.includes('Rate limit exceeded');

  if (!isRateLimitError) return next(err);

  const retryAfter = err.retryAfter || null;

  // Normalize the error using centralized utility
  const normalizedError = normalizeError(err, {
    type: 'RateLimitError',
    code: 'RATE_LIMIT_EXCEEDED',
    status: 429,
    isExpected: true,
    logLevel: 'warn',
    details: { retryAfter },
  });

  // Log the rate-limit event
  logError(normalizedError, req, {
    context: 'rate-limit-handler',
  });

  // Send structured error response
  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = rateLimitErrorHandler;
