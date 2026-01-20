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
const productRoutes = require('./products');
const skuRoutes = require('./skus');
const skuImageRoutes = require('./sku-images');
const bomRoutes = require('./boms');
const bomItemRoutes = require('./bom-items');
const complianceRecordRoutes = require('./compliance-records');
const batchRegistryRoutes = require('./batch-registry');
const productBatchRoutes = require('./product-batches');
const packagingMaterialBatchRoutes = require('./packaging-material-batches');
const priceTypeRoutes = require('./pricing-types');
const pricingRoutes = require('./pricings');
const locationTypeRoutes = require('./locations-types');
const locationRoutes = require('./locations');
const locationInventoryRoutes = require('./location-inventory');
const warehouseInventoryRoutes = require('./warehouse-inventory');
const lookupRoutes = require('./lookups');
const reportRoutes = require('./reports');
const customerRoutes = require('./customers');
const addressRoutes = require('./addresses');
const discountRoutes = require('./discounts');
const deliveryMethodRoutes = require('./delivery-methods');
const orderTypeRoutes = require('./order-types');
const orderRoutes = require('./orders');
const taxRateRoutes = require('./tax-rates');
const inventoryAllocationRoutes = require('./inventory-allocations');
const outboundFulfillmentRoutes = require('./outbound-fulfillments');
const { createApiRateLimiter } = require('../middlewares/rate-limiter');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

/**
 * Public routes (no auth required)
 */
router.use('/public', publicRoute);

// API-specific rate-limiting middleware
const apiRateLimiter = createApiRateLimiter();
router.use(apiRateLimiter);

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
 * Session lifecycle routes.
 *
 * These routes are used to establish or recover authentication
 * and MUST NOT require access-token authentication.
 *
 * Examples:
 * - Login
 * - Refresh access token
 */
router.use('/session', sessionRoute);

/**
 * Authenticated user routes.
 *
 * These routes require a valid access token and operate
 * on an already authenticated user context.
 */
router.use('/auth', authenticate(), authRoutes);

/**
 * User and admin account management
 */
router.use('/users', authenticate(), userRoutes);

/**
 * Product and SKU catalog management
 */
router.use('/products', authenticate(), productRoutes);
router.use('/skus', authenticate(), skuRoutes);
router.use('/sku-images', authenticate(), skuImageRoutes);
router.use('/compliance-records', authenticate(), complianceRecordRoutes);

router.use('/batch-registry', authenticate(), batchRegistryRoutes);
router.use('/product-batches', authenticate(), productBatchRoutes);
router.use('/packaging-material-batches', authenticate(), packagingMaterialBatchRoutes);

/**
 * @route /boms
 * @group Bill of Materials (BOM) Routes
 * @description
 * Mounts all BOM-related API endpoints under the `/boms` path.
 *
 * This router handles BOM listing, filtering, and management operations,
 * such as retrieving paginated BOM lists, fetching individual BOM details,
 * and future create/update endpoints.
 *
 * Middleware Stack:
 * - `authenticate()`: Ensures the user is authenticated before accessing any BOM endpoints.
 * - `bomRoutes`: Handles all downstream route definitions for the BOM module.
 *
 * Example Mounted Routes:
 * - `GET /api/v1/boms` → Fetch paginated BOM list
 * - `GET /api/v1/boms/:id` → Fetch specific BOM details (future)
 * - `POST /api/v1/boms` → Create a new BOM record (future)
 *
 * @example
 * // Mounting in main router (routes/index.js)
 * router.use('/boms', authenticate(), bomRoutes);
 *
 * @see authenticate
 * @see bomRoutes
 */
router.use('/boms', authenticate(), bomRoutes);

/**
 * @route /api/bom-items
 * @description
 * Mounts all BOM Item–related routes.
 *
 * This route group handles operations related to Bill of Materials (BOM) items,
 * including:
 *  - Fetching BOM material supply details (parts, packaging materials, suppliers, batches)
 *  - Calculating BOM cost summaries (estimated vs. actual)
 *  - Managing BOM-related entities
 *
 * Middleware chain:
 *  1. `authenticate()` — Verifies JWT token and user identity
 *  2. `bomItemRoutes` — Contains detailed routes (GET /:bomId/material-supply, etc.)
 *
 * Example:
 *  GET /api/bom-items/:bomId/material-supply
 *  → fetch detailed supply & cost breakdown for a BOM
 */
router.use('/bom-items', authenticate(), bomItemRoutes);

/**
 * Pricing types and pricing records
 */
router.use('/pricing-types', authenticate(), priceTypeRoutes);
router.use('/pricings', authenticate(), pricingRoutes);

/**
 * Warehouse and inventory management
 */
router.use('/warehouse-inventory', authenticate(), warehouseInventoryRoutes);

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
router.use('/addresses', authenticate(), addressRoutes);
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
router.use('/inventory-allocations', authenticate(), inventoryAllocationRoutes);
router.use('/outbound-fulfillments', authenticate(), outboundFulfillmentRoutes);

/**
 * Report generation and exports
 */
router.use('/reports', authenticate(), reportRoutes);

/**
 * Lookup routes for dropdown and reference data
 *
 * Routes under `/lookups` provide reference datasets for populating frontend dropdowns.
 * Examples include warehouses, locations, batch registries, pricing types, statuses, etc.
 * These routes support optional filters, pagination (where applicable), and require authentication.
 *
 * Use these endpoints to fetch IDs and labels for filtering, selection, or display in the UI.
 */
router.use('/lookups', authenticate(), lookupRoutes);

module.exports = router;
