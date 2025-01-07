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
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, {
    type: 'NotFoundError',
    isExpected: true, // 404 errors are generally expected
  });
  
  // Log the 404 error
  logWarn('404 Error:', {
    message: error.message,
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'Unknown',
  });
  
  // Send structured error response
  res.status(error.status).json(error.toJSON());
};

module.exports = notFoundHandler;
