/**
 * @file app.js
 * @description Main application setup, including middleware, routes, and error handling.
 */

const express = require('express');
const applyGlobalMiddleware = require('./middlewares/middleware');
const applyErrorHandlers = require('./middlewares/error-handlers/apply-error-handlers');
const { createGlobalRateLimiter } = require('./middlewares/rate-limiter');
const routes = require('./routes/routes');

const app = express();

// Apply global middleware
applyGlobalMiddleware(app);

// Apply the global rate limiter
const globalRateLimiter = createGlobalRateLimiter();
app.use(globalRateLimiter);

// Routes
const API_PREFIX = process.env.API_PREFIX;
app.use(API_PREFIX, routes);

// Apply error-handling middleware
applyErrorHandlers(app); // Catch 404 and other errors

module.exports = app;
