/**
 * @file app.js
 * @description Configures and exports the Express application.
 */

const express = require('express');
const applyGlobalMiddleware = require('./middlewares/middleware');
const applyErrorHandlers = require('./middlewares/error-handlers/apply-error-handlers');
const routes = require('./routes/routes');

const app = express();

// Apply global middleware
applyGlobalMiddleware(app);

// Routes
const API_PREFIX = process.env.API_PREFIX;
app.use(API_PREFIX, routes);

// Apply error-handling middleware
applyErrorHandlers(app); // Catch 404 and other errors

module.exports = app;
