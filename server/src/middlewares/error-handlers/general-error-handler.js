/**
 * @file general-error-handler.js
 * @description Middleware for handling unexpected or global errors.
 */

const { logError } = require('../../utils/loggerHelper');

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
  logError(err, req);
  
  const message =
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  
  res.status(err.status || 500).json({ error: message });
};

module.exports = generalErrorHandler;
