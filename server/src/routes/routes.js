/**
 * @file routes.js
 * @description  Centralized router configuration for the application.
 */

const express = require('express');
const welcomeRoute = require('./public');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');
const markAsPublic = require('../middlewares/mark-as-public');

const router = express.Router();

/**
 * @returns {Function} - API-specific rate-limiting middleware.
 */
// Apply API rate limiter globally to all routes in this router
const apiRateLimiter = createApiRateLimiter();
router.use(apiRateLimiter);

// Attach sub-routes
router.use('/public', markAsPublic, welcomeRoute);
router.use('/auth', markAsPublic, authRoutes);

router.use('/admin', adminRoutes);

// Export the router
module.exports = router;
