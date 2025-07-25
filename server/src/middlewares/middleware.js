/**
 * @file middleware.js
 * @description Centralized middleware configuration for the application.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const configureHelmet = require('./helmet');
const corsMiddleware = require('./cors'); // Custom CORS configuration
const { csrfProtection } = require('./csrf-protection');
const requestLogger = require('./request-logger');
const { createRateLimiter } = require('../utils/rate-limit-helper');
const { logSystemInfo } = require('../utils/system-logger');
const { sanitizeInput } = require('./sanitize');

/**
 * Applies global middleware to the application.
 * Ensures security, CORS handling, logging, and request body parsing.
 *
 * @param {Object} app - The Express application instance.
 */
const applyGlobalMiddleware = (app) => {
  logSystemInfo('Applying global middleware stack...', {
    context: 'applyGlobalMiddleware',
  });

  // 1. Helmet Security Headers
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(configureHelmet(isProduction));

  // 2. Global Rate Limiter
  app.use(createRateLimiter());

  // 3. CORS Middleware
  app.use(corsMiddleware);

  // 4. Combined cookie + csrf middleware step
  app.use(cookieParser(), csrfProtection());

  // 5. Body Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 6. Request Logging
  app.use(requestLogger);

  // 7. Input Sanitization Middleware
  app.use(sanitizeInput);

  // 8. Development Tools
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Use 'dev' logging format in development
    logSystemInfo('Development logging middleware (morgan) applied.', {
      context: 'applyGlobalMiddleware',
      mode: 'development',
    });
  }

  logSystemInfo('Global middleware stack applied successfully.', {
    context: 'applyGlobalMiddleware',
  });
};

module.exports = applyGlobalMiddleware;
