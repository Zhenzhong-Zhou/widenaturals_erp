/**
 * @file middleware.js
 * @description Applies the global middleware stack to the Express application.
 *
 * Middleware is registered in a deliberate order — each layer depends on or
 * builds on the one before it:
 *
 *   1. Helmet          — security headers, must run before any response is sent
 *   2. CORS            — origin validation before any request body is parsed
 *   3. Cookie parser   — must run before CSRF, which reads the cookie token
 *   4. CSRF protection — must run after cookie parser
 *   5. Body parsing    — JSON + URL-encoded, after security checks
 *   6. Request logger  — after parsing so body/context is available to log
 *   7. Sanitization    — after parsing so req.body exists to sanitize
 *   8. Morgan          — development only, lightweight request summary
 *
 * What does NOT belong here:
 *   - Route-specific middleware   → individual route files
 *   - Error handler middleware    → apply-error-handlers.js
 *   - Global rate limiter         → app.js (applied before routes)
 *   - Static file serving         → app.js (development only)
 */

'use strict';

const express      = require('express');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const configureHelmet        = require('./helmet');
const corsMiddleware         = require('./cors');
const { csrfProtection }     = require('./csrf-protection');
const requestLogger          = require('./request-logger');
const { sanitizeInput }      = require('./sanitize');
const { logSystemInfo }      = require('../utils/logging/system-logger');

const CONTEXT    = 'middleware/global';
const isDev      = process.env.NODE_ENV === 'development';

/**
 * Registers the global middleware stack on the Express application instance.
 *
 * Called once during application bootstrap in `app.js`, before routes and
 * error handlers are registered.
 *
 * @param {import('express').Application} app - The Express application instance.
 * @returns {void}
 */
const applyGlobalMiddleware = (app) => {
  // -------------------------------------------------------------------------
  // 1. Security headers
  // -------------------------------------------------------------------------
  app.use(configureHelmet);
  
  // -------------------------------------------------------------------------
  // 2. CORS
  // Origin must be validated before the request body is parsed so that
  // disallowed origins are rejected before any body processing occurs.
  // -------------------------------------------------------------------------
  app.use(corsMiddleware);
  
  // -------------------------------------------------------------------------
  // 3 + 4. Cookie parser → CSRF protection
  // cookieParser must run first — csrfProtection reads the CSRF token from
  // the cookie that cookieParser populates.
  // -------------------------------------------------------------------------
  app.use(cookieParser(), csrfProtection());
  
  // -------------------------------------------------------------------------
  // 5. Body parsing
  // Registered after CSRF so that token validation runs before the body is
  // fully parsed, avoiding unnecessary work on rejected requests.
  // -------------------------------------------------------------------------
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // -------------------------------------------------------------------------
  // 6. Request logger
  // After body parsing so structured log entries can include request context.
  // -------------------------------------------------------------------------
  app.use(requestLogger);
  
  // -------------------------------------------------------------------------
  // 7. Input sanitization
  // After body parsing so req.body, req.query, and req.params are populated.
  // -------------------------------------------------------------------------
  app.use(sanitizeInput);
  
  // -------------------------------------------------------------------------
  // 8. Morgan (development only)
  // Lightweight console request summary for local development.
  // Not used in production — structured logging covers this via requestLogger.
  // -------------------------------------------------------------------------
  if (isDev) {
    app.use(morgan('dev'));
    
    logSystemInfo('Morgan request logging enabled', {
      context: CONTEXT,
    });
  }
};

module.exports = applyGlobalMiddleware;
