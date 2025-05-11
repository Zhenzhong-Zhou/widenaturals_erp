/**
 * @file helmet-error-handler.js
 * @description Middleware for handling Helmet-related errors.
 */

const { logError } = require('../../utils/logger-helper');
const AppError = require('../../utils/AppError');

/**
 * Middleware to handle Helmet-related errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const helmetErrorHandler = (err, req, res, next) => {
  if (err.type === 'HelmetError') {
    // Ensure the error is a structured AppError
    const errorResponse = AppError.helmetError(
      err.message || 'Helmet configuration failed.',
      {
        details: err.details || null,
      }
    );
    
    // Log with structured error logging
    logError(errorResponse, req, {
      context: 'helmet-error-handler',
    });
    
    // Respond with the structured error response
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  // Pass to the next error handler if not a Helmet error
  next(err); // Not a HelmetError, pass through
};

module.exports = helmetErrorHandler;
