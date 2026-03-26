/**
 * @file cors-error-handler.js
 * @description Express error middleware that intercepts CORS errors,
 * logs them, and returns a consistent JSON response.
 * Non-CORS errors are forwarded unchanged.
 *
 * CORS violations are normalized to AppError at the source in cors.js.
 * This handler only matches, logs, and responds — no normalization needed.
 */

'use strict';

const AppError        = require('../../utils/AppError');
const { logError }    = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/cors-error-handler';

/**
 * Express error-handling middleware for CORS policy violations.
 *
 * Matches AppError instances with type CORS. All other errors are forwarded
 * to the next handler via next(err) unchanged — never swallowed.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const corsErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError) || err.type !== ERROR_TYPES.CORS) {
    return next(err);
  }
  
  logError(err, req, { context: CONTEXT });
  
  res.status(err.status).json(err.toJSON());
};

module.exports = corsErrorHandler;
