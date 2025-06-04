/**
 * @file authorization-error-handler.js
 * @description Middleware to handle authorization errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle authorization errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizationErrorHandler = (err, req, res, next) => {
  if (
    err.name === 'AuthorizationError' ||
    err.type === 'AuthorizationError' ||
    err.code === 'AUTHORIZATION_ERROR'
  ) {
    // Normalize raw errors into AppError
    const normalizedError = normalizeError(err, {
      type: 'AuthorizationError',
      code: 'AUTHORIZATION_ERROR',
      status: 403,
      logLevel: 'warn',
      isExpected: true,
    });

    // Log with structured metadata
    logError(normalizedError, req, {
      context: 'authorization-error-handler',
    });

    // Respond with structured error response
    return res.status(normalizedError.status).json(normalizedError.toJSON());
  }

  // Pass to the next error handler if not an authorization error
  next(err);
};

module.exports = authorizationErrorHandler;
