/**
 * @file authorization-error-handler.js
 * @description Middleware to handle authorization errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle authorization errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'AuthorizationError') {
    const details = typeof err === 'object' && 'details' in err ? err.details : null;
    
    // Use AppError static factory method for consistency
    const errorResponse = AppError.authorizationError(
      err.message || 'You are not authorized to perform this action.',
      {
        details, // Include additional details if provided
      }
    );

    // Log the authorization error as a warning
    logError(errorResponse, req, {
      context: 'authorization-error-handler',
    });

    // Send structured error response
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  // Pass to the next error handler if not an authorization error
  next(err);
};

module.exports = authorizationErrorHandler;
