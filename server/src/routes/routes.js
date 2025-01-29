/**
 * @file routes.js
 * @description Centralized router configuration for the application.
 */

const express = require('express');
const publicRoute = require('./public');
const csrfRoute = require('./csrf');
const internalRoute = require('./internal');
const systemRoute = require('./system');
const sessionRoute = require('./session');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const adminRoutes = require('./admin');
const productRoutes = require('./products');
const priceTypeRouts = require('./price_types');
const pricingRouts = require('./pricing');
const {
  createApiRateLimiter,
  createCsrfTokenRateLimiter,
} = require('../middlewares/rate-limiter');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// API-specific rate-limiting middleware
const apiRateLimiter = createApiRateLimiter();
router.use(apiRateLimiter);

// Public routes (no authentication required)
/**
 * Routes under `/public` are open to everyone.
 */
router.use('/public', publicRoute);

router.use('/csrf', createCsrfTokenRateLimiter(), csrfRoute);

// Internal routes (system-level operations)
/**
 * Routes under `/internal` are for internal services and require proper authorization.
 */
router.use('/internal', authenticate(), internalRoute);

// System routes (health checks, monitoring, etc.)
/**
 * Routes under `/system` handle operational tasks such as status and monitoring.
 */
router.use('/system', authenticate(), systemRoute);

// Authentication routes
/**
 * Routes under `/session` manage user login and authentication flows.
 */
router.use('/session', sessionRoute); // Public login
router.use('/auth', authenticate(), authRoutes); // Authenticated routes

// Users routes
router.use('/users', authenticate(), userRoutes);

// Admin routes
/**
 * Routes under `/admin` handle administrative operations and require authentication.
 */
router.use('/admin', authenticate(), adminRoutes);

// Price Types route
// router.use('/price-types', authenticate(), priceTypeRouts);
router.use('/price-types',  priceTypeRouts);

// Pricing route
router.use('/pricing', authenticate(), pricingRouts);

// Products route
router.use('/products', authenticate(), productRoutes);

module.exports = router;
