/**
 * @file rate-limit-error-handler.js
 * @description Middleware to handle rate limiting errors.
 */

const AppError = require('../../utils/app-error');
const { logWarn } = require('../../utils/logger-helper');

/**
 * Middleware to handle rate limiting errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  // Check if the error is related to rate limiting
  if (err.name === 'RateLimitError' || err.message.includes('Rate limit exceeded')) {
    // Use AppError factory method to create a structured error
    const rateLimitError = AppError.rateLimitError('Too Many Requests', {
      code: 'RATE_LIMIT_EXCEEDED',
      type: 'RateLimitError',
      details: {
        retryAfter: err.retryAfter || null, // Include retry-after time if available
      },
    });
    
    // Log the rate limit error with metadata
    logWarn('Rate Limit Exceeded', {
      message: rateLimitError.message,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'Unknown',
      retryAfter: rateLimitError.details.retryAfter,
    });
    
    // Respond with a structured error response
    return res.status(rateLimitError.status).json(rateLimitError.toJSON());
  }
  
  // Pass other errors to the next middleware
  next(err);
};

module.exports = rateLimitErrorHandler;
