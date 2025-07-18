/**
 * @file authorization-error-handler.js
 * @description Middleware to handle authorization errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle authorization errors.
 *
 * Catches and handles errors related to authorization (403).
 * Normalizes the error shape and logs with context metadata.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizationErrorHandler = (err, req, res, next) => {
  const isAuthorizationError =
    err?.name === 'AuthorizationError' ||
    err?.type === 'AuthorizationError' ||
    err?.code === 'AUTHORIZATION_ERROR';

  if (!isAuthorizationError) return next(err);

  const normalizedError = normalizeError(err, {
    type: 'AuthorizationError',
    code: 'AUTHORIZATION_ERROR',
    status: 403,
    logLevel: 'warn',
    isExpected: true,
  });

  logError(normalizedError, req, {
    context: 'authorization-error-handler',
  });

  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = authorizationErrorHandler;
