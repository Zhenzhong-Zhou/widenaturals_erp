/**
 * @file csrf-error-handler.js
 * @description Middleware for handling CSRF token errors.
 */

const { logError } = require('../../utils/logger-helper');

/**
 * Middleware for handling CSRF token errors.
 * Logs the error details and responds with a 403 status code.
 *
 * @param {Error} err - The error object caught by middleware.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Log the CSRF error as an error-level log
    logError('CSRF token validation failed', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      referrer: req.headers.referer || 'none',
    });
    
    // Respond with a 403 Forbidden status and a generic error message
    return res.status(403).json({
      error: 'Invalid or missing CSRF token',
    });
  }
  
  // Pass the error to the next middleware if it's not a CSRF error
  next(err);
};

module.exports = csrfErrorHandler;
