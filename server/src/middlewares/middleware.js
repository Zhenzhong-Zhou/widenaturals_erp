/**
 * @file middleware.js
 * @description Centralized middleware configuration for the application.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const xssClean = require('xss-clean');
const configureHelmet = require('./helmet');
const corsMiddleware = require('./cors'); // Custom CORS configuration
const { csrfProtection } = require('./csrf-protection');
const requestLogger = require('./request-logger');
const { createRateLimiter } = require('../utils/rate-limit-helper');

/**
 * Applies global middleware to the application.
 * Ensures security, CORS handling, logging, and request body parsing.
 *
 * @param {Object} app - The Express application instance.
 */
const applyGlobalMiddleware = (app) => {
  // 1. Helmet Security Headers
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(configureHelmet(isProduction));
  
  // 2. Global Rate Limiter
  app.use(createRateLimiter());
  
  // 3. Cookie Parser Middleware
  app.use(cookieParser());
  
  // 4. CORS Middleware
  app.use(corsMiddleware);
  
  // 5. Body Parsing Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 6. CSRF Protection
  app.use(csrfProtection());
  
  // 7. XSS Protection Middleware
  app.use(xssClean());

  // 8. Request Logging
  app.use(requestLogger);
  
  // 9. Development Tools
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Use 'dev' logging format in development
  }
};

module.exports = applyGlobalMiddleware;
