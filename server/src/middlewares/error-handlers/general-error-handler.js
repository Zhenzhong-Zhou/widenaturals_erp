/**
 * @file general-error-handler.js
 * @description Middleware for handling unexpected or global errors.
 */

const AppError = require('../../utils/app-error');
const { logError } = require('../../utils/logger-helper');

/**
 * General error handler middleware.
 * Logs the error and sends an appropriate response.
 *
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const generalErrorHandler = (err, req, res, next) => {
  // Normalize error to AppError if it's not already
  if (!(err instanceof AppError)) {
    err = new AppError(err.message || 'Unexpected Error', err.status || 500, {
      type: err.type || 'General Error',
      isExpected: false, // Treat as unexpected unless explicitly stated
    });
  }
  
  // Capture additional context for logging
  const errorMetadata = {
    route: req.originalUrl,
    method: req.method,
    userAgent: req.headers['user-agent'] || 'Unknown',
    ip: req.ip,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };
  
  // Log the error
  logError('Unhandled Error:', { ...err.toJSON(), ...errorMetadata });
  
  // Send structured error response using AppError's `toJSON` method
  res.status(err.status).json({
    ...err.toJSON(),
    ...(process.env.NODE_ENV !== 'production' && { debug: err.stack }),
  });
};

module.exports = generalErrorHandler;
