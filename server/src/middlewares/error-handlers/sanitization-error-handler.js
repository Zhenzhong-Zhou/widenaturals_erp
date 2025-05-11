/**
 * @file sanitization-error-handler.js
 * @description Middleware to handle sanitization errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle sanitization errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const sanitizationErrorHandler = (err, req, res, next) => {
  const isSanitizationError =
    err.name === 'SanitizationError' || err.type === 'SanitizationError';
  
  if (!isSanitizationError) return next(err);
  
  // Normalize the error for consistent structure
  const normalizedError = normalizeError(err, {
    type: 'SanitizationError',
    code: 'SANITIZATION_ERROR',
    status: 422,
    isExpected: true,
    logLevel: 'error',
    details: err.details || null,
  });
  
  // Log the error with structured metadata
  logError(normalizedError, req, {
    context: 'sanitization-error-handler',
  });
  
  // Return structured JSON response
  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = sanitizationErrorHandler;
