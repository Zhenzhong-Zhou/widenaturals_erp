/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const normalizeError = require('../../utils/normalize-error');
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
  const rawError = new Error(`Route not found: ${req.originalUrl}`);
  
  // Normalize the error to AppError format
  const notFoundError = normalizeError(rawError, {
    status: 404,
    type: 'NotFoundError',
    code: 'RESOURCE_NOT_FOUND',
    isExpected: true,
  });

  // Log the 404 error with relevant metadata
  logError(notFoundError, req, {
    context: 'not-found-handler',
  });

  // Send structured error response
  res.status(notFoundError.status).json(notFoundError.toJSON());
};

module.exports = notFoundHandler;
