/**
 * @file db-error-handler.js
 * @description Middleware for handling database-related errors.
 */

const { logError } = require('../../utils/loggerHelper');

/**
 * Database error handler middleware.
 * Logs database errors and sends a proper response for specific errors.
 *
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const dbErrorHandler = (err, req, res, next) => {
  if (err.code === '23505') { // Example: Unique constraint violation
    logError(err, req, { additionalInfo: 'Database unique constraint violation' });
    return res.status(400).json({ error: 'Duplicate entry detected' });
  }
  
  next(err);
};

module.exports = dbErrorHandler;
