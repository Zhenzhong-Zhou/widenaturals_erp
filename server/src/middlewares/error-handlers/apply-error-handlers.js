/**
 * @file apply-error-handlers.js
 * @description Registers all error-handling middleware on the Express application.
 *
 * Error handlers are registered in a deliberate order. Each specific handler
 * inspects the error and either resolves it (sends a response) or forwards it
 * to the next handler via next(err) if the error is not its responsibility.
 * The global catch-all at the end handles anything that was not claimed by a
 * specific handler.
 *
 * Registration order:
 *   1. Security         — helmet, csrf, cors, rate-limit
 *   2. Auth             — authentication (401), authorization (403)
 *   3. Input            — validation, sanitization
 *   4. File upload      — multer errors
 *   5. Service / health — business logic and health-check errors
 *   6. 404              — unmatched routes, registered after all route handlers
 *   7. Global catch-all — always last, handles anything not claimed above
 *
 * Called once during application bootstrap in `app.js`, after all routes are
 * registered and before the process starts accepting connections.
 */

'use strict';

const { logSystemInfo } = require('../../utils/logging/system-logger');
const csrfErrorHandler = require('./csrf-error-handler');
const corsErrorHandler = require('./cors-error-handler');
const rateLimitErrorHandler = require('./rate-limit-error-handler');
const authErrorHandler = require('./authenticate-error-handler');
const authorizationErrorHandler = require('./authorize-error-handler');
const validationErrorHandler = require('./validation-error-handler');
const sanitizationErrorHandler = require('./sanitization-error-handler');
const fileUploadErrorHandler = require('./file-upload-error-handler');
const serviceErrorHandler = require('./service-error-handler');
const notFoundHandler = require('./not-found-handler');
const globalErrorHandler = require('./global-error-handler');

/**
 * Registers all error-handling middleware on the Express application instance.
 *
 * Must be called after all routes are registered so that `notFoundHandler`
 * correctly catches unmatched routes, and `globalErrorHandler` receives any
 * error forwarded by a route or upstream middleware.
 *
 * @param {import('express').Application} app - The Express application instance.
 * @returns {void}
 */
const applyErrorHandlers = (app) => {
  logSystemInfo('Applying structured error handlers...', {
    context: 'error-handler-init',
  });

  // -------------------------------------------------------------------------
  // 1. Security errors
  // -------------------------------------------------------------------------
  app.use(csrfErrorHandler);
  app.use(corsErrorHandler);
  app.use(rateLimitErrorHandler);

  // -------------------------------------------------------------------------
  // 2. Authentication and authorization errors
  // -------------------------------------------------------------------------
  app.use(authErrorHandler);
  app.use(authorizationErrorHandler);

  // -------------------------------------------------------------------------
  // 3. Input errors
  // -------------------------------------------------------------------------
  app.use(validationErrorHandler);
  app.use(sanitizationErrorHandler);

  // -------------------------------------------------------------------------
  // 4. File upload errors
  // -------------------------------------------------------------------------
  app.use(fileUploadErrorHandler);

  // -------------------------------------------------------------------------
  // 5. Service errors
  // -------------------------------------------------------------------------
  app.use(serviceErrorHandler);

  // -------------------------------------------------------------------------
  // 6. 404 — must come after all routes so only genuinely unmatched requests
  //    reach it. Generates a structured not-found error forwarded to global.
  // -------------------------------------------------------------------------
  app.use(notFoundHandler);

  // -------------------------------------------------------------------------
  // 7. Global catch-all — must be last. Handles any error not resolved by a
  //    specific handler above. All specific handlers must call next(err) for
  //    errors they do not own, or errors will be silently swallowed.
  // -------------------------------------------------------------------------
  app.use(globalErrorHandler);

  logSystemInfo('All error handlers successfully registered.', {
    context: 'error-handler-init',
    order: [
      'csrf',
      'cors',
      'rateLimit',
      'auth',
      'authorization',
      'validation',
      'sanitization',
      'fileUpload',
      'service',
      'notFound',
      'global',
    ],
  });
};

module.exports = applyErrorHandlers;
