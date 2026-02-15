/**
 * @file app.js
 * @description Main application setup.
 *
 * Responsibilities:
 * - Configure Express instance
 * - Apply global middleware
 * - Register API routes
 * - Attach global error handlers
 *
 * Architectural Notes:
 * - Reverse proxy trust is enabled (1 hop)
 * - Trace ID middleware runs first for full request observability
 * - Static file serving is development-only
 */

const express = require('express');
const traceIdMiddleware = require('./middlewares/trace-id-middleware');
const applyGlobalMiddleware = require('./middlewares/middleware');
const applyErrorHandlers = require('./middlewares/error-handlers/apply-error-handlers');
const { createGlobalRateLimiter } = require('./middlewares/rate-limiter');
const path = require('path');
const routes = require('./routes/routes');
const corsMiddleware = require('./middlewares/cors');

const app = express();

/**
 * Trust first reverse proxy.
 * Required for correct client IP resolution (req.ip)
 * when behind NGINX / Cloudflare / load balancer.
 */
app.set('trust proxy', 1);

/**
 * Attach trace ID early to ensure:
 * - All logs include correlation ID
 * - Errors include request context
 */
app.use(traceIdMiddleware);

/**
 * Apply global middleware:
 * - body parsing
 * - security headers
 * - logging
 * - CSRF protection
 * - etc.
 */
applyGlobalMiddleware(app);

/**
 * Global rate limiting applied across API.
 * Should execute before route handling.
 */
const globalRateLimiter = createGlobalRateLimiter();
app.use(globalRateLimiter);

/**
 * Development-only static file serving.
 * In production, static assets should be served by CDN or object storage.
 */
if (process.env.NODE_ENV === 'development') {
  const rootPath = path.join(__dirname, '..');

  const uploadsRouter = express.Router();

  uploadsRouter.use(
    corsMiddleware,
    (req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      next();
    },
    express.static(path.join(rootPath, 'public/uploads'))
  );

  app.use('/uploads', uploadsRouter);
}

/**
 * API routes mounted under configurable prefix.
 */
const API_PREFIX = process.env.API_PREFIX;

if (!API_PREFIX) {
  throw new Error('API_PREFIX is not defined');
}

app.use(API_PREFIX, routes);

/**
 * Global error handling (404 + centralized error responses).
 * Must be registered after all routes.
 */
applyErrorHandlers(app);

module.exports = app;
