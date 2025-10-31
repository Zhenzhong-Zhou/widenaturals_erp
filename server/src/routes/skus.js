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
  getSkuDetailsController,
} = require('../controllers/sku-controller');

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

module.exports = router;
