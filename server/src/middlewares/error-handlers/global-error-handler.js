/**
 * @file global-error-handler.js
 * @description Final error-handling middleware for the Express application.
 *
 * This is the single normalization boundary for all unhandled errors. Every
 * error that reaches this handler — whether thrown in a controller, rejected
 * in an async handler, or forwarded via next(err) — is normalized to an
 * AppError, logged once, and returned as a consistent JSON response.
 *
 * Responsibilities:
 *   - Normalize any Error or AppError into a consistent AppError shape
 *   - Log the normalized error with full request context (once, here only)
 *   - Send a standardized JSON error response
 *
 * Rules:
 *   - Must be registered LAST in the middleware chain, after all routes and
 *     non-error middleware, so it catches everything.
 *   - Must declare all four parameters (err, req, res, next) — Express uses
 *     the function's arity to identify error-handling middleware. Omitting
 *     `next` causes Express to skip this handler entirely for errors.
 *   - Do NOT perform business logic here.
 *   - Do NOT log errors elsewhere and again here — this is the single log point.
 */

'use strict';

const AppError     = require('../../utils/AppError');
const { logError } = require('../../utils/logging/logger-helper');

/**
 * Express error-handling middleware.
 *
 * Normalizes all errors to AppError, logs once, and sends a standardized
 * JSON response. Must be the last middleware registered in the application.
 *
 * The `next` parameter is required even though it is never called — Express
 * uses the 4-argument signature to identify error-handling middleware. Removing
 * it causes Express to silently skip this handler for all errors.
 *
 * @param {Error | AppError}                err  - Incoming error.
 * @param {import('express').Request}        req  - Express request object.
 * @param {import('express').Response}       res  - Express response object.
 * @param {import('express').NextFunction}   next - Required for Express error
 *   handler identification. Called only if headers have already been sent.
 * @returns {void}
 */
const globalErrorHandler = (err, req, res, next) => {
  // ------------------------------------------------------------------
  // If headers were already sent (e.g. a streaming response partially
  // flushed before the error), delegate to Express's built-in finalizer
  // which will close the connection cleanly.
  // ------------------------------------------------------------------
  if (res.headersSent) {
    return next(err);
  }
  
  // ------------------------------------------------------------------
  // Normalize to AppError — single source of truth for error shape.
  // AppError instances pass through unchanged.
  // All other errors (native Error, third-party, unknown throws) are
  // wrapped into a generalError so the response shape is always consistent.
  // ------------------------------------------------------------------
  const appError = err instanceof AppError
    ? err
    : AppError.generalError(
      err?.message || 'An unexpected error occurred.',
      {
        // Preserve the original error name and message for internal
        // observability without exposing raw stack traces to the client.
        meta: {
          originalErrorName:    err?.name,
          originalErrorMessage: err?.message,
        },
        // Only carry over status if it looks like a valid HTTP error code.
        // Never trust arbitrary status values from unknown third-party errors.
        ...(err?.status && err?.status >= 400 && err?.status < 600 && { status: err.status }),
      }
    );
  
  // ------------------------------------------------------------------
  // Log once here — do not log the same error again anywhere upstream.
  // Logging after normalization means the log entry always reflects the
  // exact shape and status that the client receives.
  // ------------------------------------------------------------------
  logError(appError, req, {
    context: 'global-error-handler',
    stage:   'response-finalization',
  });
  
  // ------------------------------------------------------------------
  // Send standardized response.
  // appError.toJSON() strips internal fields (stack, meta) so only the
  // safe, client-facing shape is returned.
  // ------------------------------------------------------------------
  res.status(appError.status).json(appError.toJSON());
};

module.exports = globalErrorHandler;
