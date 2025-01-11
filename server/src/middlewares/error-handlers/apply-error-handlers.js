/**
 * @file apply-error-handlers.js
 * @description Combines and applies all error-handling middleware.
 */

const helmetErrorHandler = require('./helmet-error-handler');
const csrfErrorHandler = require('./csrf-error-handler');
const authErrorHandler = require('./authenticate-error-handler');
const authorizationErrorHandler = require('./authorize-error-handler');
const rateLimitErrorHandler = require('./rate-limit-error-handler');
const corsErrorHandler = require('./cors-error-handler');
const validationErrorHandler = require('./validation-error-handler');
const sanitizationErrorHandler = require('./sanitization-error-handler');
const fileUploadErrorHandler = require('./file-upload-error-handler');
const healthErrorHandler = require('./health-error-handler');
const serviceErrorHandler = require('./service-error-handler');
const dbErrorHandler = require('./db-error-handler');
const notFoundHandler = require('./not-found-handler');
const globalErrorHandler = require('./global-error-handler');

/**
 * Applies error-handling middleware to the application.
 *
 * @param {object} app - The Express application instance.
 */
const applyErrorHandlers = (app) => {
  // Security and input-related error handlers
  app.use(helmetErrorHandler); // Helmet-related errors
  app.use(csrfErrorHandler); // CSRF token errors
  app.use(corsErrorHandler); // CORS-related errors
  app.use(rateLimitErrorHandler); // Rate limit violations
  
  // Authentication and authorization errors
  app.use(authErrorHandler); // Authentication-related errors
  app.use(authorizationErrorHandler); // Authorization errors
  
  // Input validation and sanitization errors
  app.use(validationErrorHandler); // Validation errors
  app.use(sanitizationErrorHandler); // Sanitization errors
  
  // File upload errors
  app.use(fileUploadErrorHandler); // File upload-related errors
  
  // Service and database-related error handlers
  app.use(healthErrorHandler); // Health-check-related errors
  app.use(serviceErrorHandler); // Service-level errors
  app.use(dbErrorHandler); // Database-related errors
  
  // 404 Not Found handler
  app.use(notFoundHandler); // Handle 404 errors last
  
  // Global error handler (catch-all)
  app.use(globalErrorHandler); // Catch-all for uncaught errors
};

module.exports = applyErrorHandlers;
