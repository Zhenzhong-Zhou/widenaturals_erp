/**
 * @file app.js
 * @description Express application factory. Configures middleware, routes, and error handlers.
 *
 * Responsibilities:
 *   - Configure the Express instance
 *   - Apply global middleware in the correct order
 *   - Register API routes under the configured prefix
 *   - Attach global error handlers after all routes
 *
 * Middleware order (order is load-bearing):
 *   1. Trust proxy       — must be set before any middleware reads req.ip
 *   2. Trace ID          — must run first so all subsequent logs include a correlation ID
 *   3. Global middleware — body parsing, security headers, CSRF, logging, etc.
 *   4. Rate limiter      — applied after parsing so headers are readable, before routes
 *   5. Routes            — all API handlers
 *   6. Error handlers    — must be last so they catch errors from all routes above
 *
 * Environment behaviour:
 *   - Static file serving (/uploads) is mounted in development only.
 *     In production, static assets must be served by a CDN or object storage.
 */

'use strict';

// -----------------------------------------------------------------------------
// Node built-ins
// -----------------------------------------------------------------------------
const path = require('path');

// -----------------------------------------------------------------------------
// Third-party
// -----------------------------------------------------------------------------
const express = require('express');

// -----------------------------------------------------------------------------
// Internal
// -----------------------------------------------------------------------------
const AppError = require('./utils/AppError');
const { logSystemException } = require('./utils/logging/system-logger');
const attachTraceId = require('./middlewares/trace-id');
const applyGlobalMiddleware = require('./middlewares/middleware');
const applyErrorHandlers = require('./middlewares/error-handlers/apply-error-handlers');
const { createGlobalRateLimiter } = require('./middlewares/rate-limiter');
const corsMiddleware = require('./middlewares/cors');
const routes = require('./routes/routes');

// -----------------------------------------------------------------------------
// App instance
// -----------------------------------------------------------------------------
const app = express();

// -----------------------------------------------------------------------------
// Reverse proxy trust
// Required for correct client IP resolution (req.ip) when running behind
// NGINX, Cloudflare, or a load balancer. Must be set before any middleware
// that reads req.ip (rate limiter, logger, etc.).
// -----------------------------------------------------------------------------
app.set('trust proxy', 1);

// -----------------------------------------------------------------------------
// Trace ID — must run before everything else so that all downstream logs,
// errors, and responses carry a consistent correlation ID for the request.
// -----------------------------------------------------------------------------
app.use(attachTraceId);

// -----------------------------------------------------------------------------
// Global middleware
// Covers: body parsing, security headers (Helmet), CSRF, request logging.
// See middlewares/middleware.js for the full list and order.
// -----------------------------------------------------------------------------
applyGlobalMiddleware(app);

// -----------------------------------------------------------------------------
// Global rate limiter
// Applied after body parsing (so headers are readable) and before route
// handlers so that rate-limited requests never reach business logic.
// -----------------------------------------------------------------------------
app.use(createGlobalRateLimiter());

// -----------------------------------------------------------------------------
// Development-only static file serving
//
// Serves uploaded files directly from disk at /uploads. This is intentionally
// disabled in production — static assets should be served by a CDN or object
// storage (e.g. S3 + CloudFront) to avoid tying up Node worker threads.
//
// CORP and COEP headers are set explicitly because the default same-origin
// policy would block cross-origin image/video requests from the dev frontend.
// -----------------------------------------------------------------------------
if (process.env.NODE_ENV === 'development') {
  const uploadsRouter = express.Router();
  const uploadsPath = path.join(__dirname, '..', 'public/uploads');
  
  uploadsRouter.use(
    corsMiddleware,
    (_req, res, next) => {
      // Allow cross-origin access to uploaded assets in the dev environment.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      next();
    },
    express.static(uploadsPath)
  );
  
  app.use('/uploads', uploadsRouter);
}

// -----------------------------------------------------------------------------
// API routes
// -----------------------------------------------------------------------------
const API_PREFIX = process.env.API_PREFIX;

if (!API_PREFIX) {
  // This runs at module load time, before runStartupStep wraps anything,
  // so log explicitly before throwing to ensure the error appears in structured logs.
  const error = AppError.initializationError(
    'API_PREFIX environment variable is not defined.'
  );
  logSystemException(error, 'Missing required env var: API_PREFIX', {
    context: 'startup/app',
  });
  throw error;
}

app.use(API_PREFIX, routes);

// -----------------------------------------------------------------------------
// Global error handlers
// Must be registered after all routes so they catch errors thrown anywhere
// above. Covers 404 (no route matched) and all other unhandled errors.
// -----------------------------------------------------------------------------
applyErrorHandlers(app);

module.exports = app;
