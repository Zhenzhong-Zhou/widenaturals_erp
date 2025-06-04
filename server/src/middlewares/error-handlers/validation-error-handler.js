/**
 * @file validation-error-handler.js
 * @description Middleware to handle validation errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle validation errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name !== 'ValidationError' && err.type !== 'ValidationError') {
    return next(err); // Not a validation error
  }

  const normalizedError = normalizeError(err, {
    type: 'ValidationError',
    code: 'VALIDATION_ERROR',
    status: 400,
    isExpected: true,
    details: err.details || null,
  });

  logError(normalizedError, req, {
    context: 'validation-error-handler',
  });

  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = validationErrorHandler;
