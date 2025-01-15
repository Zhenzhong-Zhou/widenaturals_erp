/**
 * @file global-error-handler.js
 * @description Middleware for handling all errors in the application.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');
const { sanitizeMessage } = require('../../utils/sensitive-data-utils');

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
  
  // Prepare additional metadata for logging
  const errorMetadata = {
    ip: req.ip || 'N/A',
    method: req.method || 'N/A',
    route: req.originalUrl || 'N/A',
    userAgent: req.headers['user-agent'] || 'Unknown',
    body: sanitizeMessage(req.body) || 'N/A', // Sanitize to avoid exposing sensitive data
    headers: req.headers || {},
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };
  
  // Log the error with metadata
  logError('Global Error:', {
    ...err.toJSON(),
    ...errorMetadata,
  });
  
  // Send structured error response
  res.status(err.status || 500).json({
    ...err.toJSON(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = globalErrorHandler;
