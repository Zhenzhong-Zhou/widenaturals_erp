/**
 * @file csrf-error-handler.js
 * @description Middleware for handling CSRF token errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware for handling CSRF token errors.
 * Logs the error details and responds with a structured response.
 *
 * @param {Error} err - The error object caught by middleware.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  const enrichedDetails = {
    message: err.message,
    code: err.code,
    origin: req.headers.origin || 'Unknown',
  };
  
  // Normalize the error
  const normalizedError = normalizeError(err, {
    type: 'CSRFError',
    code: 'CSRF_ERROR',
    isExpected: true,
    logLevel: 'warn',
    details: enrichedDetails,
  });
  
  // Log the CSRF error with context and request metadata
  logError(normalizedError, req, {
    context: 'csrf-error-handler',
    referrer: req.headers?.referer || 'None',
  })

  // Respond with a structured error response
  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = csrfErrorHandler;
