/**
 * @file csrf-error-handler.js
 * @description Middleware for handling CSRF token errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware for handling CSRF token errors.
 * Logs the error details and responds with a structured response.
 *
 * @param {Error} err - The error object caught by middleware.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Use the AppError factory method for CSRF violations
    const csrfError = AppError.csrfError('Invalid or missing CSRF token', {
      details: {
        message: err.message,
        code: err.code,
        origin: req.headers.origin,
      },
    });

    // Log the CSRF error with detailed metadata
    logError(csrfError, req, {
      context: 'csrf-error-handler',
      referrer: req.headers?.referer || 'None',
    });
    
    // Respond with a structured error response
    return res.status(csrfError.status).json(csrfError.toJSON());
  }

  // Pass the error to the next middleware if it's not a CSRF error
  next(err);
};

module.exports = csrfErrorHandler;
