/**
 * @file routes.js
 * @description  Centralized router configuration for the application.
 */

const express = require('express');
const publicRoute = require('./public');
const loginRoute = require('./login');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');
const authenticate = require('../middlewares/auth');

const router = express.Router();

/**
 * @returns {Function} - API-specific rate-limiting middleware.
 */
const apiRateLimiter = createApiRateLimiter();
router.use(apiRateLimiter);

// Public routes
router.use('/public', publicRoute);

// Authentication routes
router.use('/auth',  loginRoute);
router.use('/auth', authenticate(), authRoutes);

// Admin routes
router.use('/admin', authenticate(), adminRoutes);

// Export the router
module.exports = router;
