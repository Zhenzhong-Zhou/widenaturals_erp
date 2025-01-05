/**
 * @file middleware.js
 * @description Centralized middleware configuration for the application.
 */

const express = require('express');
const helmet = require('helmet');
const corsMiddleware = require('./cors');
const requestLogger = require('./request-logger');
const morgan = require('morgan');
const { logWarn } = require('../utils/logger-helper');
const { csrfProtection } = require('./csrf-protection');
const { createRateLimiter } = require('../utils/rate-limit-helper');
const cookieParser = require('cookie-parser');

/**
 * Applies global middleware to the application.
 * Ensures security, CORS handling, logging, and request body parsing.
 *
 * @param {Object} app - The Express application instance.
 */
const applyGlobalMiddleware = (app) => {
  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in development
    })
  );
  
  // 2. Cookie Parser Middleware
  app.use(cookieParser());
  
  // 3. CORS Middleware
  app.use((req, res, next) => {
    corsMiddleware(req, res, (err) => {
      if (err) {
        logWarn(`CORS error: ${err.message}`);
        return next(err); // Pass error to centralized error handler
      }
      next();
    });
  });
  
  // 4. CSRF Protection
  app.use(csrfProtection());
  
  // 5. Global Rate Limiter
  app.use(createRateLimiter());
  
  // 6. Body Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 7. Request Logging
  app.use(requestLogger);
  
  // 8. Development Tools
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Use 'dev' logging format in development
  }
};

module.exports = applyGlobalMiddleware;
