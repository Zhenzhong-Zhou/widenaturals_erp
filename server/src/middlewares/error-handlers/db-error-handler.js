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
  // Handle unique constraint violation
  if (err.code === '23505') {
    logError('Database Error: Unique constraint violation', {
      message: err.message,
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
  if (err.code === '23503') {
    logError('Database Error: Foreign key constraint violation', {
      message: err.message,
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
  
  // Handle other known database errors
  if (err.code) {
    logError('Database Error:', {
      message: err.message,
      code: err.code,
      table: err.table || 'unknown',
      route: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
    
    const errorResponse = new AppError('Database error occurred.', 500, {
      type: 'DatabaseError',
      code: `DB_ERROR_${err.code}`,
      isExpected: false,
    });
    
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
  
  // Pass other errors to the next middleware
  next(err);
};

module.exports = dbErrorHandler;
