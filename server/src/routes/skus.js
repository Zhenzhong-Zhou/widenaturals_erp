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
const { skuIdParamSchema } = require('../validators/sku-validators');
const {
  getActiveSkuProductCardsController,
  getSkuDetailsController, getSkuBomCompositionController,
} = require('../controllers/sku-controller');
const validate = require('../middlewares/validate');

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
 * ---------------------------------------------------------------------
 * GET /api/v1/skus/:skuId/bom
 * ---------------------------------------------------------------------
 * @summary Fetch BOM composition and estimated cost for a given SKU.
 * @description
 * Retrieves the active Bill of Materials (BOM) for the specified SKU.
 * Includes:
 *   - Product & SKU metadata
 *   - Active BOM header (revision, status, audit info)
 *   - BOM items (parts, quantities, and estimated unit costs)
 *   - Summary cost estimation (based on BOM-level `estimated_unit_cost`)
 *
 * Note:
 * This cost is **estimated** and does **not** include supplier batch actuals.
 * For accurate costing, refer to the Supplier Batch Cost Service.
 *
 * @route GET /api/v1/skus/:skuId/bom
 * @access Protected
 *
 * @param {string} skuId.path.required - SKU UUID (validated via Joi)
 * @returns {200} Structured BOM composition `{ header, details, summary }`
 * @returns {400} Invalid SKU ID format
 * @returns {404} No active BOM found for this SKU
 * @returns {403} User not authorized
 * @example
 * // Request
 * GET /api/v1/skus/374cfaad-a0ca-44dc-bfdd-19478c21f899/bom
 *
 * // Response
 * {
 *   "header": { "sku": { "code": "PG-TCM300-R-CN" }, "bom": { "revision": 1 } },
 *   "details": [ { "part": { "name": "Bottle" }, "quantityPerUnit": 1 } ],
 *   "summary": { "type": "ESTIMATED", "totalEstimatedCost": 3.25, "currency": "CAD" }
 * }
 */
router.get(
  '/:skuId/bom',
  authorize([PERMISSIONS.SKUS.VIEW_BOM_DETAILS]),
  validate(skuIdParamSchema, 'params'),            // Joi validation middleware
  getSkuBomCompositionController // Controller
);

module.exports = router;
