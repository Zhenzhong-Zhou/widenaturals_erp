/**
 * @file not-found-handler.js
 * @description Middleware for handling 404 errors.
 */

const { logWarn } = require('../../utils/loggerHelper');

/**
 * Not found handler middleware.
 * Logs 404 errors and sends a proper response.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  logWarn('Route not found', req);
  
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
};

module.exports = notFoundHandler;
