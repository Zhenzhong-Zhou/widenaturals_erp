/**
 * @file routes.js
 * @description  Centralized router configuration for the application.
 */

const express = require('express');
const welcomeRoute = require('./public');
const authRoutes = require('./auth');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * @returns {Function} - API-specific rate-limiting middleware.
 */
// Apply API rate limiter globally to all routes in this router
const apiRateLimiter = createApiRateLimiter();
router.use(apiRateLimiter);

// Attach sub-routes
router.use('/public', welcomeRoute);
router.use('/auth', authRoutes);

// Export the router
module.exports = router;
