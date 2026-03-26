/**
 * @file authenticate-error-handler.js
 * @description Express error middleware that intercepts authentication and
 * token-related errors, maps them to user-friendly messages, and returns a
 * consistent JSON error response.
 *
 * Design principles:
 *   - Domain isolation: only handles authentication-related AppErrors
 *   - Non-AppErrors are forwarded immediately — never wrapped as auth errors
 *   - Non-auth AppErrors are forwarded to the next error handler
 *   - Message mapping overrides internal messages for UX consistency
 *
 * Must be registered BEFORE the global error handler.
 */

'use strict';

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logging/logger-helper');
const { ERROR_TYPES, ERROR_CODES } = require('../../utils/constants/error-constants');

const CONTEXT = 'middleware/auth-error-handler';

// -----------------------------------------------------------------------------
// Auth domain classifiers (Set for O(1) lookup per request)
// -----------------------------------------------------------------------------

/**
 * AppError types that belong to the authentication domain.
 * @type {Set<string>}
 */
const AUTH_ERROR_TYPES = new Set([
  ERROR_TYPES.AUTHENTICATION,
  ERROR_TYPES.ACCESS_TOKEN,
  ERROR_TYPES.ACCESS_TOKEN_EXPIRED,
  ERROR_TYPES.REFRESH_TOKEN,
  ERROR_TYPES.REFRESH_TOKEN_EXPIRED,
  ERROR_TYPES.TOKEN_REVOKED,
  ERROR_TYPES.SESSION_EXPIRED,
  ERROR_TYPES.ACCOUNT_LOCKED,
]);

/**
 * AppError codes that belong to the authentication domain.
 * @type {Set<string>}
 */
const AUTH_ERROR_CODES = new Set([
  ERROR_CODES.ACCESS_TOKEN_MISSING,
  ERROR_CODES.ACCESS_TOKEN_INVALID,
  ERROR_CODES.ACCESS_TOKEN_EXPIRED,
  ERROR_CODES.REFRESH_TOKEN_MISSING,
  ERROR_CODES.REFRESH_TOKEN_INVALID,
  ERROR_CODES.REFRESH_TOKEN_EXPIRED,
  ERROR_CODES.TOKEN_REVOKED,
  ERROR_CODES.SESSION_EXPIRED,
  ERROR_CODES.AUTHENTICATION,
  ERROR_CODES.ACCOUNT_LOCKED,
]);

// -----------------------------------------------------------------------------
// User-facing message map
// Overrides internal AppError messages with consistent client-facing copy.
// Falls back to the original AppError message if no mapping exists.
// -----------------------------------------------------------------------------

/**
 * @type {Record<string, string>}
 */
const AUTH_ERROR_MESSAGES = {
  [ERROR_CODES.AUTHENTICATION]:        'Authentication failed. Please log in.',
  [ERROR_CODES.ACCOUNT_LOCKED]:        'Your account has been locked. Please contact support.',
  [ERROR_CODES.ACCESS_TOKEN_MISSING]:  'Access token is missing. Please log in.',
  [ERROR_CODES.ACCESS_TOKEN_INVALID]:  'Access token is invalid. Please log in again.',
  [ERROR_CODES.ACCESS_TOKEN_EXPIRED]:  'Access token has expired. Please use your refresh token.',
  [ERROR_CODES.REFRESH_TOKEN_MISSING]: 'Refresh token is missing. Please log in.',
  [ERROR_CODES.REFRESH_TOKEN_INVALID]: 'Refresh token is invalid. Please log in again.',
  [ERROR_CODES.REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired. Please log in again.',
  [ERROR_CODES.TOKEN_REVOKED]:         'Your session has been revoked. Please log in again.',
  [ERROR_CODES.SESSION_EXPIRED]:       'Your session has expired. Please log in again.',
};

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

/**
 * Express error middleware for authentication-related errors.
 *
 * Handles only AppErrors whose type or code belongs to the auth domain.
 * All other errors — including non-AppError throwables — are forwarded
 * unchanged to the next error handler.
 *
 * @param {Error | AppError} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const authenticateErrorHandler = (err, req, res, next) => {
  // Non-AppError throwables (TypeError, ReferenceError, etc.) are never
  // auth errors — forward immediately without wrapping.
  if (!(err instanceof AppError)) {
    next(err);
    return;
  }
  
  // Check both type and code so errors are caught regardless of which
  // property the originating factory set. Also covers JWT library errors
  // that surface as UnauthorizedError by name.
  const isAuthError =
    AUTH_ERROR_TYPES.has(err.type) ||
    AUTH_ERROR_CODES.has(err.code) ||
    err.name === 'UnauthorizedError';
  
  // Not an auth error — let the next domain handler or global handler decide.
  if (!isAuthError) {
    next(err);
    return;
  }
  
  // Use the mapped UX message if one exists; preserve the original otherwise.
  const finalMessage = AUTH_ERROR_MESSAGES[err.code] ?? err.message;
  
  // Log the original AppError before overriding the message in the response
  // so the internal error code and context are always visible in logs.
  logError(err, req, {
    context: CONTEXT,
    stage:   'token-validation',
  });
  
  res.status(err.status).json({
    ...err.toJSON(),
    message: finalMessage,
  });
};

module.exports = authenticateErrorHandler;
