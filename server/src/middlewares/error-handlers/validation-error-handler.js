/**
 * @file validation-error-handler.js
 * @description Middleware to handle validation errors.
 */

const AppError = require('../../utils/app-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle validation errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError' || err.type === 'ValidationError') {
    // Create a structured AppError for validation violations
    const validationError = new AppError(err.message || 'Validation failed.', 400, {
      type: 'ValidationError',
      isExpected: true,
      code: 'VALIDATION_ERROR',
      details: err.details || null, // Include validation details if available
    });
    
    // Log the validation error with detailed metadata
    logError('Validation Error:', {
      message: validationError.message,
      details: validationError.details,
      method: req.method,
      route: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
    });
    
    // Respond with a structured error response
    return res.status(validationError.status).json(validationError.toJSON());
  }
  
  // If it's not a validation error, pass it to the next middleware
  next(err);
};

module.exports = validationErrorHandler;
