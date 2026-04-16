/**
 * @file validation-error-handler.js
 * @description Express error middleware that intercepts validation errors,
 * logs them, and returns a consistent JSON response.
 * Non-validation errors are forwarded unchanged.
 *
 * Validation errors are normalized to AppError at the source in validate.js.
 * This handler only matches, logs, and responds — no normalization needed.
 */

'use strict';

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/validation-error-handler';

/**
 * Express error-handling middleware for validation errors.
 *
 * Matches AppError instances with type VALIDATION. All other errors are
 * forwarded to the next handler via next(err) unchanged — never swallowed.
 *
 * Unlike other handlers, validation errors carry a `details` array from Joi
 * that is already sanitized at the source in validate.js and included in
 * appError.toJSON() — no special response shaping needed here.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const validationErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError) || err.type !== ERROR_TYPES.VALIDATION) {
    return next(err);
  }

  logError(err, req, { context: CONTEXT });

  res.status(err.status).json(err.toJSON());
};

module.exports = validationErrorHandler;
