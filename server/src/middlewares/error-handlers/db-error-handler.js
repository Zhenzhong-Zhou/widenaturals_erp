/**
 * @file db-error-handler.js
 * @description Middleware for handling database-related errors.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Database error handler middleware.
 * Logs database errors and sends them to the global error handler.
 *
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const dbErrorHandler = (err, req, res, next) => {
  // Check if the error is a database error (identified by `err.code`)
  if (!err.code) return next(err); // Not a database error, pass it to the next handler
  
  const { table = 'unknown', constraint = 'unknown' } = err;
  
  let errorResponse;
  
  // Unique constraint violation (e.g., duplicate key)
  if (err.code === '23505') {
    errorResponse = AppError.validationError('Duplicate entry detected.', {
      type: 'DatabaseError',
      code: 'DB_UNIQUE_CONSTRAINT',
      isExpected: true,
      details: { table, constraint, pgCode: err.code },
    });
  }
  
  // Foreign key constraint violation
  else if (err.code === '23503') {
    errorResponse = AppError.validationError('Foreign key constraint violated.', {
      type: 'DatabaseError',
      code: 'DB_FOREIGN_KEY_CONSTRAINT',
      isExpected: true,
      details: { table, constraint, pgCode: err.code },
    });
  }
  
  if (errorResponse) {
    logError(errorResponse, req, {
      context: 'db-error-handler',
    });
    
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }
  
  // Unknown DB error — pass through
  next(err);
};

module.exports = dbErrorHandler;
