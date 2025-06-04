/**
 * @file db-error-handler.js
 * @description Middleware for handling database-related errors.
 */

const normalizeError = require('../../utils/normalize-error');
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
  // Skip if the error doesn't appear to be DB-related
  if (!err.code) return next(err);
  
  const { table = 'unknown', constraint = 'unknown', code = 'UNKNOWN_DB_ERROR' } = err;
  
  let errorResponse;
  
  if (err.code === '23505') {
    // Unique constraint violation
    errorResponse = normalizeError(err, {
      message: 'Duplicate entry detected.',
      type: 'DatabaseError',
      code: 'DB_UNIQUE_CONSTRAINT',
      isExpected: true,
      details: { table, constraint, pgCode: code },
    });
  } else if (err.code === '23503') {
    // Foreign key constraint violation
    errorResponse = normalizeError(err, {
      message: 'Foreign key constraint violated.',
      type: 'DatabaseError',
      code: 'DB_FOREIGN_KEY_CONSTRAINT',
      isExpected: true,
      details: { table, constraint, pgCode: code },
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
