/**
 * @file global-error-handler.js
 * @description Middleware for handling all errors in the application.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Global error handler middleware.
 * Normalizes errors, logs them, and sends structured responses.
 *
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const globalErrorHandler = (err, req, res, next) => {
  // Normalize the error to an AppError instance if it's not already
  if (!(err instanceof AppError)) {
    err = AppError.generalError(
      err.message || 'An unexpected error occurred.',
      {
        status: err.status || 500,
        type: 'GeneralError',
        isExpected: false,
      }
    );
  }

  // Log the error with full context (auto-extracts req metadata)
  logError(err, req, {
    context: 'global-error-handler',
    stage: 'response-finalization',
  });
  
  // Send structured error response
  res.status(err.status || 500).json(err.toJSON());
};

module.exports = globalErrorHandler;
