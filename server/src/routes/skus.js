/**
 * @fileoverview
 * SKU API Routes — ERP Product Management Module
 *
 * These routes handle SKU retrieval, product card listing, and
 * associated BOM (Bill of Materials) composition fetching.
 *
 * Includes:
 *   - Active SKU product cards
 *   - Detailed SKU information
 *   - Active BOM composition with estimated cost
 */

const express = require('express');
const authorize = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getActiveSkuProductCardsController,
  getSkuDetailsController, createSkusController,
} = require('../controllers/sku-controller');
const validate = require('../middlewares/validate');
const { createSkuBulkSchema } = require('../validators/sku-validators');

const router = express.Router();

/**
 * ---------------------------------------------------------------------
 * GET /api/v1/skus/cards/active
 * ---------------------------------------------------------------------
 * @summary Fetch a paginated list of active SKU product cards.
 * @description
 * Returns lightweight SKU summaries for display in dashboards or lists.
 * Supports pagination and optional filtering by `status_id`.
 *
 * @route GET /api/v1/skus/cards/active?status_id={uuid}&page={number}&limit={number}
 * @access Protected
 *
 * @queryparam {string} [status_id] Optional status filter (UUID)
 * @queryparam {number} [page=1] Current page index for pagination
 * @queryparam {number} [limit=20] Number of results per page
 *
 * @returns {200} JSON array of product cards with pagination meta
 * @returns {403} When user lacks permission
 */
router.get(
  '/cards/active',
  authorize([PERMISSIONS.SKUS.VIEW_CARDS]),
  getActiveSkuProductCardsController
);

/**
 * ---------------------------------------------------------------------
 * GET /api/v1/skus/sku-details/:skuId
 * ---------------------------------------------------------------------
 * @summary Retrieve detailed SKU and product information.
 * @description
 * Returns a comprehensive view of the SKU, including product metadata,
 * region, language, and category details.
 *
 * @route GET /api/v1/skus/sku-details/:skuId
 * @access Protected
 *
 * @param {string} skuId.path.required - SKU UUID
 * @returns {200} Detailed SKU record with product metadata
 * @returns {400} Invalid SKU ID format
 * @returns {404} SKU not found
 * @returns {403} User not authorized
 */
router.get(
  '/sku-details/:skuId',
  authorize([PERMISSIONS.SKUS.VIEW_DETAILS]),
  getSkuDetailsController
);

/**
 * @route POST /skus/create
 * @group SKUs
 * @permission SKUS.CREATE
 *
 * @description
 * Bulk SKU creation endpoint.
 * Accepts an array of SKU definitions and generates SKU codes,
 * enforces business rules, locks related products, performs duplicate
 * checks, and inserts all SKUs in a single transactional operation.
 *
 * Request body must match `createSkuBulkSchema`, which validates:
 *   - product_id (UUID)
 *   - brand_code / category_code / variant_code / region_code
 *   - optional metadata (barcode, size_label, description, dimensions, etc.)
 *
 * Middlewares:
 *   1. authorize([SKUS.CREATE])
 *        - Ensures caller has permission to create SKUs.
 *
 *   2. validate(createSkuBulkSchema, 'body')
 *        - Ensures payload structure and values are valid before passing
 *          request to controller.
 *
 *   3. createSkusController
 *        - Executes bulk creation using service + business logic layers.
 *        - Handles logging, error wrapping, and API response formatting.
 *
 * Expected JSON payload (example):
 * {
 *   "skus": [
 *     {
 *       "product_id": "uuid",
 *       "brand_code": "CH",
 *       "category_code": "HN",
 *       "variant_code": "200",
 *       "region_code": "CA",
 *       "barcode": "628693253017",
 *       "size_label": "60 Capsules",
 *       "description": "Hair Nutrition CA",
 *       "length_cm": 5.2,
 *       "width_cm": 5.0,
 *       "height_cm": 10.0,
 *       "weight_g": 150
 *     }
 *   ]
 * }
 *
 * Success Response:
 *   - HTTP 201
 *   - JSON body containing normalized and enriched SKU records.
 */
router.post(
  '/create',
  authorize([PERMISSIONS.SKUS.CREATE]),
  validate(createSkuBulkSchema, 'body'),
  createSkusController
);

module.exports = router;
