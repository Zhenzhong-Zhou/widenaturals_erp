/**
 * @file routes.js
 * @description  Centralized router configuration for the application.
 */

const express = require('express');
const welcomeRoute = require('./welcome');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

// Apply API rate limiter globally to all routes in this router
router.use(createApiRateLimiter);

// Attach sub-routes
router.use('/', welcomeRoute);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Export the router
module.exports = router;
