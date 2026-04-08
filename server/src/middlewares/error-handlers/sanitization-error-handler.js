/**
 * @file sanitization-error-handler.js
 * @description Express error middleware that intercepts sanitization errors,
 * logs them, and returns a consistent JSON response.
 * Non-sanitization errors are forwarded unchanged.
 *
 * Sanitization errors are normalized to AppError at the source in sanitize.js.
 * This handler only matches, logs, and responds — no normalization needed.
 */

'use strict';

const AppError        = require('../../utils/AppError');
const { logError }    = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/sanitization-error-handler';

/**
 * Express error-handling middleware for sanitization errors.
 *
 * Matches AppError instances with type SANITIZATION. All other errors are
 * forwarded to the next handler via next(err) unchanged — never swallowed.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const sanitizationErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError) || err.type !== ERROR_TYPES.SANITIZATION) {
    return next(err);
  }
  
  logError(err, req, { context: CONTEXT });
  
  res.status(err.status).json(err.toJSON());
};

module.exports = sanitizationErrorHandler;
