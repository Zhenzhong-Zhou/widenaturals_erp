/**
 * @file helmet-error-handler.js
 * @description Middleware for handling Helmet-related errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle Helmet-related errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const helmetErrorHandler = (err, req, res, next) => {
  if (err.type === 'HelmetError') {
    const normalizedError = normalizeError(err, {
      type: 'HelmetError',
      code: 'HELMET_ERROR',
      logLevel: 'error',
      isExpected: true,
      details: err.details || null,
    });

    // Log with structured error logging
    logError(normalizedError, req, {
      context: 'helmet-error-handler',
    });

    // Respond with the structured error response
    return res.status(normalizedError.status).json(normalizedError.toJSON());
  }

  // Pass to the next error handler if not a Helmet error
  next(err); // Not a HelmetError, pass through
};

module.exports = helmetErrorHandler;
