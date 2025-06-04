/**
 * @file global-error-handler.js
 * @description Middleware for handling all errors in the application.
 */

const normalizeError = require('../../utils/normalize-error');
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
  // Always normalize the error to ensure consistent structure
  const normalizedError = normalizeError(err, {
    type: 'GeneralError',
    code: 'GENERAL_ERROR',
    isExpected: false,
    status: err.status || 500,
  });

  // Log the error with full context (auto-extracts req metadata)
  logError(err, req, {
    context: 'global-error-handler',
    stage: 'response-finalization',
  });

  // Send structured error response
  res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = globalErrorHandler;
