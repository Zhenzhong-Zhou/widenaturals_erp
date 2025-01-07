/**
 * @file rate-limit-error-handler.js
 * @description Middleware to handle rate limiting errors.
 */

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
    logWarn(`Rate Limit Exceeded: ${err.message}`, {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });
    
    // Respond with a 429 Too Many Requests status
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the allowed number of requests. Please try again later.',
      retryAfter: err.retryAfter || null, // Include retry-after time if available
    });
  }
  
  // Pass other errors to the next middleware
  next(err);
};

module.exports = rateLimitErrorHandler;
