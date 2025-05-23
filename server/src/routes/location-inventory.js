const express = require('express');
const {
  getLocationInventoryKpiSummaryController,
  getLocationInventorySummaryController,
  getLocationInventorySummaryDetailsController,
  getLocationInventoryRecordController,
} = require('../controllers/location-inventory-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @route GET /location-inventory
 * @description Fetch paginated location inventory records with filtering support.
 * @group Location Inventory - Endpoints for accessing inventory by location, batch, and metadata.
 *
 * @permission view_location_inventory - Required to access location inventory data.
 *
 * @queryparam {number} [page=1] - Page number for pagination
 * @queryparam {number} [limit=20] - Number of items per page
 * @queryparam {string} [batchType] - Filter by batch type ('product' | 'packaging_material')
 * @queryparam {string} [locationName] - Filter by location name (ILIKE)
 * @queryparam {string} [productName] - Filter by product name (ILIKE)
 * @queryparam {string} [sku] - Filter by SKU (ILIKE)
 * @queryparam {string} [materialName] - Filter by material name (ILIKE)
 * @queryparam {string} [materialCode] - Filter by material code (ILIKE)
 * @queryparam {string} [materialType] - Filter by material type (ILIKE)
 * @queryparam {string} [partName] - Filter by part name (ILIKE)
 * @queryparam {string} [partCode] - Filter by part code (ILIKE)
 * @queryparam {string} [partType] - Filter by part type (ILIKE)
 * @queryparam {string} [lotNumber] - Filter by lot number (ILIKE for product or material batches)
 * @queryparam {string} [status] - Filter by inventory status name
 * @queryparam {string} [statusId] - Filter by inventory status ID
 * @queryparam {string} [inboundDate] - Exact match for inbound date (YYYY-MM-DD)
 * @queryparam {string} [expiryDate] - Exact match for expiry date (YYYY-MM-DD)
 * @queryparam {string} [createdAt] - Exact match for creation date (YYYY-MM-DD)
 *
 * @returns {200} 200 - A paginated list of inventory records
 */
router.get('/',
  authorize(['view_location_inventory']),
  getLocationInventoryRecordController);

/**
 * @route GET /api/location-inventory/kpi-summary
 * @description Returns KPI summary metrics for location inventory.
 *              Supports optional filtering by item type.
 *
 * @access Protected
 * @queryParam {string} [itemType] - Optional filter: 'product' or 'packaging_material'
 * @returns {200} JSON array containing grouped KPI metrics including total row
 */
router.get('/kpi-summary',
  authorize([
    'view_inventory',
    'view_location_inventory',
    'view_inventory_summary'
  ]),
  getLocationInventoryKpiSummaryController);

/**
 * @route GET /location-inventory/summary
 * @group Location Inventory - Summary
 * @description Returns a paginated summary of location-based inventory (products and materials),
 * grouped by SKU or material code. Supports optional filters for item type.
 *
 * @access Protected
 * @permission view_location_inventory - Required to view location inventory summaries.
 * @param {string} itemType.query.optional - Optional filter: 'product', 'material', or 'all'
 * @param {number} page.query.optional - Page number (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Paginated inventory summary
 * @returns {object} 403 - Forbidden if missing required permissions
 */
router.get('/summary',
  authorize([
    'view_inventory',
    'view_location_inventory',
    'view_inventory_summary'
  ]),
  getLocationInventorySummaryController);

/**
 * @route GET /location-inventory/summary/:itemId/details
 * @group Location Inventory - Summary
 * @summary Get paginated location inventory summary details for a specific item (product SKU or packaging material).
 * @param {string} itemId.path.required - The ID of the SKU (product) or packaging material
 * @param {number} page.query.optional - Page number for pagination (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Success response with paginated location inventory summary
 * @returns {object} 400 - Validation error if itemId is missing or invalid
 * @returns {object} 403 - Forbidden if permission is missing
 * @returns {object} 500 - Internal server error
 * @permission view_location_inventory - Required to access location inventory summary
 */
router.get('/summary/:itemId/details',
  authorize([
    'view_inventory',
    'view_location_inventory',
    'view_product_inventory',
    'view_material_inventory'
  ]),
  getLocationInventorySummaryDetailsController);

module.exports = router;
