/**
 * @file db-error-handler.js
 * @description Middleware for handling database-related errors.
 */

const AppError = require('../../utils/app-error');
const { logError } = require('../../utils/logger-helper');

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
  // Check if the error is a database error (identified by `err.code`)
  if (!err.code) {
    return next(err); // Not a database error, pass it to the next middleware
  }
  
  // Ensure defaults for error properties
  const message = err.message || 'Unknown database error occurred.';
  const code = err.code || 'UNKNOWN_DB_ERROR';
  
  // Handle unique constraint violation
  if (code === '23505') {
    logError('Database Error: Unique constraint violation', {
      message,
      table: err.table || 'unknown',
      constraint: err.constraint || 'unknown',
      route: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
    
    const errorResponse = new AppError('Duplicate entry detected.', 400, {
      type: 'DatabaseError',
      code: 'DB_UNIQUE_CONSTRAINT',
      isExpected: true,
    });
    
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
  
  // Handle foreign key constraint violation
  if (code === '23503') {
    logError('Database Error: Foreign key constraint violation', {
      message,
      table: err.table || 'unknown',
      constraint: err.constraint || 'unknown',
      route: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
    
    const errorResponse = new AppError('Foreign key constraint violated.', 400, {
      type: 'DatabaseError',
      code: 'DB_FOREIGN_KEY_CONSTRAINT',
      isExpected: true,
    });
    
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
  
  // Log and propagate other database errors
  logError('Unexpected Database Error:', {
    message,
    code,
    table: err.table || 'unknown',
    route: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  
  return next(err); // Pass to the general error handler
};

module.exports = dbErrorHandler;
