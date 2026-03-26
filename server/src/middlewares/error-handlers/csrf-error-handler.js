/**
 * @file csrf-error-handler.js
 * @description Express error middleware that intercepts CSRF token errors,
 * logs them, and returns a consistent JSON response.
 * Non-CSRF errors are forwarded unchanged.
 *
 * CSRF violations are normalized to AppError at the source in csrf-protection.js.
 * This handler only matches, logs, and responds — no normalization needed.
 */

'use strict';

const AppError        = require('../../utils/AppError');
const { logError }    = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/csrf-error-handler';

/**
 * Express error-handling middleware for CSRF token violations.
 *
 * Matches AppError instances with type CSRF. All other errors are forwarded
 * to the next handler via next(err) unchanged — never swallowed.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError) || err.type !== ERROR_TYPES.CSRF) {
    return next(err);
  }
  
  logError(err, req, { context: CONTEXT });
  
  res.status(err.status).json(err.toJSON());
};

module.exports = csrfErrorHandler;
