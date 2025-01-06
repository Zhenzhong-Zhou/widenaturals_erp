/**
 * @file general-error-handler.js
 * @description Middleware for handling unexpected or global errors.
 */

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
  // Capture additional context
  const errorMetadata = {
    message: err.message || 'Unknown error',
    status: err.status || 500,
    type: err.type || 'General Error',
    isExpected: !!err.isExpected,
    route: req.originalUrl,
    method: req.method,
    userAgent: req.headers['user-agent'] || 'Unknown',
    ip: req.ip,
  };
  
  // Include response body if available
  if (res.body) {
    errorMetadata.responseBody = res.body;
  }
  
  // Include res.locals error context if set
  if (res.locals.error) {
    errorMetadata.localsError = {
      message: res.locals.error.message,
      stack: res.locals.error.stack,
    };
  }
  
  // Log the error
  logError('Unhandled Error:', errorMetadata);
  
  // Determine the response message
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message;
  
  // Send response to the client
  if (err.isExpected) {
    return res.status(err.status || 400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({ error: message });
};

module.exports = generalErrorHandler;
