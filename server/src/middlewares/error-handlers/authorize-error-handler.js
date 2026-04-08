/**
 * @file authorize-error-handler.js
 * @description Handles authorization errors (403) before they reach the
 * global catch-all. Specific handlers like this one allow per-error-type
 * logging context and response control without polluting globalErrorHandler.
 *
 * If the error is not an authorization error, it is forwarded untouched to
 * the next error handler via next(err). All specific handlers must do this
 * for errors they do not own — failing to call next(err) silently swallows
 * unrelated errors.
 */

'use strict';

const AppError     = require('../../utils/AppError');
const { logError } = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/authorize-error-handler';

/**
 * Express error-handling middleware for authorization errors.
 *
 * Matches errors where AppError.type is 'AuthorizationError'. All other
 * errors are forwarded to the next handler unchanged.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const authorizationErrorHandler = (err, req, res, next) => {
  // Forward anything that is not an authorization error to the next handler.
  // Never swallow unrecognized errors — they must reach globalErrorHandler.
  if (!(err instanceof AppError) || err.type !== ERROR_TYPES.AUTHORIZATION) {
    return next(err);
  }
  
  // Error is already a normalized AppError — log and respond directly.
  // No re-normalization needed; AppError was shaped correctly at the source.
  logError(err, req, { context: CONTEXT });
  
  res.status(err.status).json(err.toJSON());
};

module.exports = authorizationErrorHandler;
