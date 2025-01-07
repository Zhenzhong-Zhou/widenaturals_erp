/**
 * @file sanitization-error-handler.js
 * @description Middleware to handle sanitization errors.
 */

const AppError = require('../../utils/app-error');
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
    // Normalize to an AppError for sanitization violations
    const sanitizationError = new AppError(err.message || 'Sanitization failed.', 400, {
      type: 'SanitizationError',
      isExpected: true,
      code: 'SANITIZATION_ERROR',
      details: err.details || null, // Include sanitization details if available
    });
    
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
    return res.status(sanitizationError.status).json(sanitizationError.toJSON());
  }
  
  // Pass non-sanitization errors to the next middleware
  next(err);
};

module.exports = sanitizationErrorHandler;
