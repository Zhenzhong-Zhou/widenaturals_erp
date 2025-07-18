/**
 * @file app.js
 * @description Main application setup, including middleware, routes, and error handling.
 */

const express = require('express');
const applyGlobalMiddleware = require('./middlewares/middleware');
const applyErrorHandlers = require('./middlewares/error-handlers/apply-error-handlers');
const { createGlobalRateLimiter } = require('./middlewares/rate-limiter');
const path = require('path');
const routes = require('./routes/routes');
const corsMiddleware = require('./middlewares/cors');

const app = express();

// Apply global middleware
applyGlobalMiddleware(app);

// Apply the global rate limiter
const globalRateLimiter = createGlobalRateLimiter();
app.use(globalRateLimiter);

// Serve Static Images (only in development)
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

// Routes
const API_PREFIX = process.env.API_PREFIX;
app.use(API_PREFIX, routes);

// Apply error-handling middleware
applyErrorHandlers(app); // Catch 404 and other errors

module.exports = app;
