/**
 * @file routes.js
 * @description Centralized router configuration for all API routes in the application.
 * Defines route entry points and applies middleware such as authentication and rate-limiting.
 *
 * All routes are organized by resource and access level:
 * - Public: No authentication required
 * - Protected: Authenticated user access
 * - Internal/System: Used by infrastructure or background jobs
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
const skuRoutes = require('./skus');
const complianceRoutes = require('./compliances');
const priceTypeRoutes = require('./pricing-types');
const pricingRoutes = require('./pricings');
const locationTypeRoutes = require('./locations-types');
const locationRoutes = require('./locations');
const locationInventoryRoutes = require('./location-inventory');
const warehouseInventoryRoutes = require('./warehouse-inventory');
const warehouseLotAdjustmentRoutes = require('./lot-adjustment-type');
const dropdownRoutes = require('./dropdown');
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

/**
 * Public routes (no auth required)
 */
router.use('/public', publicRoute);

/**
 * CSRF token and protection utilities
 */
router.use('/csrf', csrfRoute);

/**
 * Internal routes for service-to-service communication
 */
router.use('/internal', authenticate(), internalRoute);

/**
 * System routes (e.g., health check, monitoring)
 */
router.use('/system', authenticate(), systemRoute);

/**
 * Session management (login/logout, session refresh)
 */
router.use('/session', sessionRoute); // Login/logout

/**
 * Authenticated user profile and token validation routes
 */
router.use('/auth', authenticate(), authRoutes);

/**
 * User and admin account management
 */
router.use('/users', authenticate(), userRoutes);
router.use('/admin', authenticate(), adminRoutes);

/**
 * Product and SKU catalog management
 */
router.use('/products', authenticate(), productRoutes);
router.use('/skus', authenticate(), skuRoutes);
router.use('/compliances', authenticate(), complianceRoutes);

/**
 * Pricing types and pricing records
 */
router.use('/pricing-types', authenticate(), priceTypeRoutes);
router.use('/pricings', authenticate(), pricingRoutes);

/**
 * Warehouse and inventory management
 */
router.use('/warehouse-inventory', authenticate(), warehouseInventoryRoutes);
router.use(
  '/lot-adjustment-types',
  authenticate(),
  warehouseLotAdjustmentRoutes
);

/**
 * Location-related management
 */
router.use('/location-types', authenticate(), locationTypeRoutes);
router.use('/locations', authenticate(), locationRoutes);
router.use('/location-inventory', authenticate(), locationInventoryRoutes);

/**
 * Order processing and customer-related endpoints
 */
router.use('/customers', authenticate(), customerRoutes);
router.use('/orders', authenticate(), orderRoutes);
router.use('/order-types', authenticate(), orderTypeRoutes);

/**
 * Discounts, delivery, and tax settings
 */
router.use('/discounts', authenticate(), discountRoutes);
router.use('/delivery-methods', authenticate(), deliveryMethodRoutes);
router.use('/tax-rates', authenticate(), taxRateRoutes);

/**
 * Inventory allocation processing
 */
router.use('/inventory-allocation', authenticate(), inventoryAllocationRoutes);

/**
 * Report generation and exports
 */
router.use('/reports', authenticate(), reportRoutes);

/**
 * Dropdown options and reference data routes
 *
 * Routes under `/dropdown` provide datasets used to populate frontend dropdowns,
 * such as batch registries, locations, warehouses, pricing types, etc.
 * These routes support filters and pagination, and require authentication.
 */
router.use('/dropdown', authenticate(), dropdownRoutes);

module.exports = router;
