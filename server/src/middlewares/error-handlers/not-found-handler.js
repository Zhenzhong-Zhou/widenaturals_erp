/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Not found handler middleware.
 *
 * Express 404 handler for unmatched routes.
 * Logs and returns a standardized not-found error respond.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  const error = AppError.notFoundError(`Route not found: ${req.originalUrl}`);

  // Log the 404 error with relevant metadata
  logError(error, req, {
    context: 'not-found-handler',
  });

  // Send structured error response
  res.status(error.status).json(error.toJSON());
};

module.exports = notFoundHandler;
