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
const complianceRoutes = require('./compliances');
const priceTypeRouts = require('./pricing-types');
const pricingRouts = require('./pricings');
const locationTypeRouts = require('./locations-types');
const locationRouts = require('./locations');
const inventoryRouts = require('./inventory');
const warehouseRouts = require('./warehouses');
const warehouseInventoryRouts = require('./warehouse-inventory');
const warehouseInventoryLotRouts = require('./warehouse-invnetory-lot');
const warehouseLotAdjustmentRoutes = require('./lot-adjustment-type');
const reportRoutes = require('./reports');
const customerRoutes = require('./customers');
const discountRoutes = require('./discounts');
const deliveryMethodRoutes = require('./delivery-methods');
const orderTypeRoutes = require('./order-types');
const orderRoutes = require('./orders');
const taxRateRoutes = require('./tax-rates');
const inventoryAllocationRoutes = require('./inventory-allocation');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');
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

router.use('/csrf', csrfRoute);

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

// Products route
router.use('/products', authenticate(), productRoutes);

router.use('/compliances', authenticate(), complianceRoutes);

// Price Types route
router.use('/pricing-types', authenticate(), priceTypeRouts);

// Pricing route
/**
 * @route GET /api/pricings
 * @desc Fetch paginated pricing records
 * @access Protected
 */
router.use('/pricings', authenticate(), pricingRouts);

// Location Types route
router.use('/location-types', authenticate(), locationTypeRouts);

router.use('/locations', authenticate(), locationRouts);

router.use('/inventories', authenticate(), inventoryRouts);

router.use('/warehouses', authenticate(), warehouseRouts);

router.use('/warehouse-inventories', authenticate(), warehouseInventoryRouts);

router.use(
  '/warehouse-inventory-lots',
  authenticate(),
  warehouseInventoryLotRouts
);

router.use(
  '/lot-adjustment-types',
  authenticate(),
  warehouseLotAdjustmentRoutes
);

router.use('/reports', authenticate(), reportRoutes);

router.use('/customers', authenticate(), customerRoutes);

router.use('/discounts', authenticate(), discountRoutes);

router.use('/delivery-methods', authenticate(), deliveryMethodRoutes);

router.use('/orders', authenticate(), orderRoutes);

router.use('/order-types', authenticate(), orderTypeRoutes);

router.use('/tax-rates', authenticate(), taxRateRoutes);

router.use('/inventory-allocation', authenticate(), inventoryAllocationRoutes);

module.exports = router;
