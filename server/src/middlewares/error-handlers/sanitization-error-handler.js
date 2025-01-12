/**
 * @file sanitization-error-handler.js
 * @description Middleware to handle sanitization errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle sanitization errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const sanitizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'SanitizationError' || err.type === 'SanitizationError') {
    // Use the AppError factory method to create a structured sanitization error
    const sanitizationError = AppError.sanitizationError(
      err.message || 'Sanitization failed.',
      {
        details: err.details || null, // Include sanitization details if available
      }
    );

    // Log the sanitization error with metadata for debugging
    logError('Sanitization Error:', {
      message: sanitizationError.message,
      details: sanitizationError.details,
      method: req.method,
      route: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
    });

    // Respond with a structured error response
    return res
      .status(sanitizationError.status)
      .json(sanitizationError.toJSON());
  }

  // Pass non-sanitization errors to the next middleware
  next(err);
};

module.exports = sanitizationErrorHandler;
