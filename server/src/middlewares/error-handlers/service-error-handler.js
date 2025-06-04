/**
 * @file service-error-handler.js
 * @description Middleware to handle service-level (business logic) errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle service-level errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const serviceErrorHandler = (err, req, res, next) => {
  if (err.name !== 'ServiceError') return next(err);

  const normalizedError = normalizeError(err, {
    type: 'ServiceError',
    code: 'SERVICE_ERROR',
    status: err.status || 500,
    isExpected: false,
    logLevel: 'warn',
    details: err.details || null,
  });

  logError(normalizedError, req, {
    context: 'service-error-handler',
  });

  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = serviceErrorHandler;
