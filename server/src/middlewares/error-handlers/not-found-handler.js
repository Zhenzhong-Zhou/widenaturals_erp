/**
 * @file not-found-handler.js
 * @description Express middleware that catches unmatched routes and forwards
 * a structured 404 AppError to the global error handler.
 *
 * Registered after all routes in apply-error-handlers.js so only genuinely
 * unmatched requests reach it. Forwards via next(err) rather than responding
 * directly — globalErrorHandler is the single response boundary for all errors.
 */

'use strict';

const AppError = require('../../utils/AppError');

const CONTEXT = 'middleware/not-found-handler';

/**
 * Express middleware for unmatched routes (404).
 *
 * Creates a structured AppError and forwards it to the next error handler
 * via next(err). Does not respond directly — consistent with the pattern
 * that globalErrorHandler is the single log-and-respond boundary.
 *
 * This is a regular 3-argument middleware, not a 4-argument error handler.
 * It generates an error rather than receiving one.
 *
 * @param {import('express').Request}      req  - Express request object.
 * @param {import('express').Response}     _res  - Express response object (unused).
 * @param {import('express').NextFunction} next - Forwards the 404 error.
 * @returns {void}
 */
const notFoundHandler = (req, _res, next) => {
  next(
    AppError.notFoundError(`Route not found: ${req.method} ${req.originalUrl}`)
  );
};

module.exports = notFoundHandler;
