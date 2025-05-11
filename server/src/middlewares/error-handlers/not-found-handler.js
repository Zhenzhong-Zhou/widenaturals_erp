/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Not found handler middleware.
 * Logs 404 errors and sends a structured response.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  // Create a structured AppError for 404 Not Found
  const notFoundError = AppError.notFoundError(`Route not found: ${req.originalUrl}`);

  // Log the 404 error with relevant metadata
  logError(notFoundError, req, {
    context: 'not-found-handler',
  });

  // Send structured error response
  res.status(notFoundError.status).json(notFoundError.toJSON());
};

module.exports = notFoundHandler;
