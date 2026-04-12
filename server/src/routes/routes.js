/**
 * @file routes.js
 * @description Centralized router configuration. Mounts all resource routes
 * under their respective paths and applies authentication and rate-limiting.
 *
 * Access levels:
 * - Public:    no authentication required
 * - Protected: valid access token required via authenticate()
 */

'use strict';

const express                        = require('express');
const { createApiRateLimiter }       = require('../middlewares/rate-limiter');
const authenticate                   = require('../middlewares/authenticate');
const publicRoute                    = require('./public');
const csrfRoute                      = require('./csrf');
const sessionRoute                   = require('./session');
const authRoutes                     = require('./auth');
const internalRoute                  = require('./internal');
const systemRoute                    = require('./system');
const userRoutes                     = require('./users');
const productRoutes                  = require('./products');
const skuRoutes                      = require('./skus');
const skuImageRoutes                 = require('./sku-images');
const bomRoutes                      = require('./boms');
const bomItemRoutes                  = require('./bom-items');
const complianceRecordRoutes         = require('./compliance-records');
const batchRegistryRoutes            = require('./batch-registry');
const productBatchRoutes             = require('./product-batches');
const packagingMaterialBatchRoutes   = require('./packaging-material-batches');
const pricingTypeRoutes              = require('./pricing-types');
const pricingGroupRoutes             = require('./pricing-groups');
const pricingRoutes                  = require('./pricings');
const locationTypeRoutes             = require('./locations-types');
const locationRoutes                 = require('./locations');
const locationInventoryRoutes        = require('./location-inventory');
const warehouseInventoryRoutes       = require('./warehouse-inventory');
const customerRoutes                 = require('./customers');
const addressRoutes                  = require('./addresses');
const discountRoutes                 = require('./discounts');
const deliveryMethodRoutes           = require('./delivery-methods');
const orderTypeRoutes                = require('./order-types');
const orderRoutes                    = require('./orders');
const taxRateRoutes                  = require('./tax-rates');
const inventoryAllocationRoutes      = require('./inventory-allocations');
const outboundFulfillmentRoutes      = require('./outbound-fulfillments');
const reportRoutes                   = require('./reports');
const lookupRoutes                   = require('./lookups');

const router = express.Router();

// ─── Public (no authentication required) ─────────────────────────────────────

router.use('/public', publicRoute);

// Global API rate limiter — applied to all routes below this point
router.use(createApiRateLimiter());

router.use('/csrf', csrfRoute);

// ─── Session (must run before authenticate — establishes the session) ─────────

/**
 * Login and token refresh routes. These must not require an access token
 * since they are the mechanism for obtaining one.
 */
router.use('/session', sessionRoute);

// ─── Authenticated ────────────────────────────────────────────────────────────

router.use('/auth',     authenticate(), authRoutes);
router.use('/internal', authenticate(), internalRoute);
router.use('/system',   authenticate(), systemRoute);

// Users
router.use('/users', authenticate(), userRoutes);

// Product catalog
router.use('/products',    authenticate(), productRoutes);
router.use('/skus',        authenticate(), skuRoutes);
router.use('/sku-images',  authenticate(), skuImageRoutes);

// BOMs
router.use('/boms',      authenticate(), bomRoutes);
router.use('/bom-items', authenticate(), bomItemRoutes);

// Compliance and batches
router.use('/compliance-records',          authenticate(), complianceRecordRoutes);
router.use('/batch-registry',              authenticate(), batchRegistryRoutes);
router.use('/product-batches',             authenticate(), productBatchRoutes);
router.use('/packaging-material-batches',  authenticate(), packagingMaterialBatchRoutes);

// Pricing
router.use('/pricing-types',  authenticate(), pricingTypeRoutes);
router.use('/pricing-groups', authenticate(), pricingGroupRoutes);
router.use('/pricings',       authenticate(), pricingRoutes);

// Locations and warehouse inventory
router.use('/location-types',       authenticate(), locationTypeRoutes);
router.use('/locations',            authenticate(), locationRoutes);
router.use('/location-inventory',   authenticate(), locationInventoryRoutes);
router.use('/warehouse-inventory',  authenticate(), warehouseInventoryRoutes);

// Customers and orders
router.use('/customers',      authenticate(), customerRoutes);
router.use('/addresses',      authenticate(), addressRoutes);
router.use('/order-types',    authenticate(), orderTypeRoutes);
router.use('/orders',         authenticate(), orderRoutes);

// Discounts, delivery, and tax
router.use('/discounts',         authenticate(), discountRoutes);
router.use('/delivery-methods',  authenticate(), deliveryMethodRoutes);
router.use('/tax-rates',         authenticate(), taxRateRoutes);

// Fulfillment
router.use('/inventory-allocations',  authenticate(), inventoryAllocationRoutes);
router.use('/outbound-fulfillments',  authenticate(), outboundFulfillmentRoutes);

// Reports
router.use('/reports', authenticate(), reportRoutes);

// Lookups
router.use('/lookups', authenticate(), lookupRoutes);

module.exports = router;
