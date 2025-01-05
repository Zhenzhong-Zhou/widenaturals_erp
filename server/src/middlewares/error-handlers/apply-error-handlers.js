/**
 * @file apply-error-handlers.js
 * @description Combines and applies all error-handling middleware.
 */

const notFoundHandler = require('./not-found-handler');
const generalErrorHandler = require('./general-error-handler');
const authErrorHandler = require('./auth-error-handler');
const dbErrorHandler = require('./db-error-handler');
const csrfErrorHandler = require('./csrf-error-handler');

const applyErrorHandlers = (app) => {
  app.use(csrfErrorHandler);     // Handle CSRF token errors
  app.use(authErrorHandler);     // Handle authentication errors
  app.use(dbErrorHandler);       // Handle database errors
  app.use(notFoundHandler);      // Handle 404 errors
  app.use(generalErrorHandler);  // Catch-all for general errors
};

module.exports = applyErrorHandlers;
