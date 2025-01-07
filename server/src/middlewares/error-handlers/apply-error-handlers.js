/**
 * @file apply-error-handlers.js
 * @description Combines and applies all error-handling middleware.
 */

const csrfErrorHandler = require('./csrf-error-handler');
const authErrorHandler = require('./authenticate-error-handler');
const rateLimitErrorHandler = require('./rate-limit-error-handler');
const corsErrorHandler = require('./cors-error-handler');
const validationErrorHandler = require('./validation-error-handler');
const sanitizationErrorHandler = require('./sanitization-error-handler');
const fileUploadErrorHandler = require('./file-upload-error-handler');
const authorizationErrorHandler = require('./authorize-error-handler');
const serviceErrorHandler = require('./service-error-handler');
const dbErrorHandler = require('./db-error-handler');
const notFoundHandler = require('./not-found-handler');
const generalErrorHandler = require('./general-error-handler');

/**
 * Applies error-handling middleware to the application.
 *
 * @param {object} app - The Express application instance.
 */
const applyErrorHandlers = (app) => {
  // Specific error handlers
  app.use(csrfErrorHandler); // CSRF token errors (specific and high-priority)
  app.use(authErrorHandler); // Authentication-related errors
  app.use(rateLimitErrorHandler); // Rate limit violations
  app.use(corsErrorHandler); // CORS-related errors
  app.use(validationErrorHandler); // Validation errors (specific to input validation)
  app.use(sanitizationErrorHandler); // Sanitization errors (specific to input sanitization)
  app.use(fileUploadErrorHandler); // File upload errors
  app.use(authorizationErrorHandler); // Authorization errors
  app.use(serviceErrorHandler); // Service-level errors
  app.use(dbErrorHandler); // Database-related errors
  
  // Catch-all error handlers
  app.use(notFoundHandler); // Handle 404 errors last (after route processing)
  app.use(generalErrorHandler); // Catch-all for uncaught errors
};

module.exports = applyErrorHandlers;
