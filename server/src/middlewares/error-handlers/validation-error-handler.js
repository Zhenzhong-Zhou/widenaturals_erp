/**
 * @file validation-error-handler.js
 * @description Middleware to handle validation errors.
 */

const AppError = require('../../utils/AppError');
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
    // Normalize the error as an AppError instance if it's not already
    const validationError = err instanceof AppError
      ? err
      : AppError.validationError(
        err.message || 'Validation failed.',
        {
          details: err.details || null,
          ...err,
        }
      );

    // Log the validation error with detailed metadata
    logError(validationError, req, {
      context: 'validation-error-handler',
    });
    
    // Respond with a structured error response
    return res.status(validationError.status).json(validationError.toJSON());
  }

  // If it's not a validation error, pass it to the next middleware
  next(err);
};

module.exports = validationErrorHandler;
