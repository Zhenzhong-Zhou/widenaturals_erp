/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const AppError = require('../../utils/app-error');
const { logWarn } = require('../../utils/logger-helper');

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
  const notFoundError = AppError.notFoundError(`Route not found: ${req.originalUrl}`, {
    code: 'NOT_FOUND',
    type: 'NotFoundError',
    isExpected: true, // 404 errors are generally expected
  });
  
  // Log the 404 error with relevant metadata
  logWarn('404 Error:', {
    message: notFoundError.message,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
  });
  
  // Send structured error response
  res.status(notFoundError.status).json(notFoundError.toJSON());
};

module.exports = notFoundHandler;
