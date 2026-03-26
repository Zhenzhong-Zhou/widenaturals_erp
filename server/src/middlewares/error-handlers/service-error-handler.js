/**
 * @file service-error-handler.js
 * @description Express error middleware that intercepts service-layer errors,
 * logs them, and returns a consistent JSON response.
 * Non-service errors are forwarded unchanged.
 *
 * All service-layer errors are normalized to AppError at the source using
 * the appropriate static factory. This handler only matches, logs, and responds.
 */

'use strict';

const AppError        = require('../../utils/AppError');
const { logError }    = require('../../utils/logging/logger-helper');
const { ERROR_TYPES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/service-error-handler';

/**
 * AppError types that belong to the service layer.
 * Checked with Set for O(1) lookup per request.
 *
 * @type {Set<string>}
 */
const SERVICE_ERROR_TYPES = new Set([
  ERROR_TYPES.SERVICE,
  ERROR_TYPES.EXTERNAL_SERVICE,
  ERROR_TYPES.DATABASE,
  ERROR_TYPES.BUSINESS,
  ERROR_TYPES.CONFLICT,
  ERROR_TYPES.TRANSFORMER,
  ERROR_TYPES.CONTROLLER,
]);

/**
 * Express error-handling middleware for service-layer errors.
 *
 * Matches AppError instances whose type belongs to the service domain.
 * All other errors are forwarded to the next handler via next(err)
 * unchanged — never swallowed.
 *
 * @param {Error | AppError}               err  - Incoming error.
 * @param {import('express').Request}       req  - Express request object.
 * @param {import('express').Response}      res  - Express response object.
 * @param {import('express').NextFunction}  next - Forwards unmatched errors.
 * @returns {void}
 */
const serviceErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError) || !SERVICE_ERROR_TYPES.has(err.type)) {
    return next(err);
  }
  
  logError(err, req, { context: CONTEXT });
  
  res.status(err.status).json(err.toJSON());
};

module.exports = serviceErrorHandler;
