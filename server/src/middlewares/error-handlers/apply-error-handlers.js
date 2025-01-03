/**
 * @file apply-error-handlers.js
 * @description Combines and applies all error-handling middleware.
 */

const notFoundHandler = require('./not-found-handler');
const generalErrorHandler = require('./general-error-handler');
const authErrorHandler = require('./auth-error-handler');
const dbErrorHandler = require('./db-error-handler');

const applyErrorHandlers = (app) => {
  app.use(authErrorHandler);  // Authentication errors
  app.use(dbErrorHandler);    // Database errors
  app.use(notFoundHandler);   // 404 errors
  app.use(generalErrorHandler); // Global errors
};

module.exports = applyErrorHandlers;
