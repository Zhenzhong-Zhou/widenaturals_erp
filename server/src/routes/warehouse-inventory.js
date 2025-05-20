const express = require('express');
const {
  getPaginatedWarehouseInventorySummaryController,
  getWarehouseInventorySummaryDetailsController,
  getAllWarehouseInventoriesController,
  getWarehouseItemSummaryController,
  getWarehouseInventoryDetailsController,
} = require('../controllers/warehouse-inventory-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * @route GET /warehouse-inventory/summary
 * @group Warehouse Inventory - Summary
 * @description Returns a paginated summary of warehouse inventory items (products and materials),
 * grouped by SKU or material code. Supports filtering by `itemType=product` or `itemType=material`.
 *
 * @access Protected
 * @permission view_warehouse_inventory - Required to view warehouse inventory summaries.
 * @param {string} itemType.query.optional - Optional filter: 'product', 'material', or 'all'
 * @param {number} page.query.optional - Page number (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Paginated inventory summary
 * @returns {object} 403 - Forbidden if missing required permissions
 */
router.get('/summary',
  authorize([
    'view_inventory',
    'view_warehouse_inventory',
    'view_inventory_summary'
  ]),
  sanitizeInput,
  getPaginatedWarehouseInventorySummaryController);

/**
 * @route GET /warehouse-inventory/summary/:itemId/details
 * @group Warehouse Inventory - Summary
 * @summary Fetch paginated warehouse inventory summary details for a specific item (SKU or packaging material)
 * @param {string} itemId.path.required - SKU ID or Material ID to filter inventory records
 * @param {number} page.query.optional - Page number for pagination (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Success response with paginated inventory summary
 * @returns {object} 400 - Validation error if itemId is missing or invalid
 * @returns {object} 403 - Forbidden if the user lacks proper permissions
 * @returns {object} 500 - Internal server error
 * @permission view_warehouse_inventory - Only authorized roles can access this route (e.g., admin, inventory_manager, warehouse_operator)
 */
router.get(
  '/summary/:itemId/details',
  authorize([
    'view_inventory',
    'view_warehouse_inventory',
    'view_product_inventory',
    'view_material_inventory'
  ]),
  sanitizeInput,
  getWarehouseInventorySummaryDetailsController
);

// GET /api/warehouse-inventory - Fetch all warehouse inventories with pagination
router.get(
  '/',
  authorize(['view_warehouses', 'manage_warehouses']),
  getAllWarehouseInventoriesController
);

/**
 * @route GET /warehouse-inventories/:warehouse_id/items-summary
 * @desc Get warehouse item summary with pagination
 * @access Private
 */
router.get(
  '/:warehouse_id/items-summary',
  authorize(['view_warehouses', 'manage_warehouses']),
  getWarehouseItemSummaryController
);

/**
 * @route GET /api/warehouse-inventory/:warehouse_id
 * @desc Get inventory details for a specific warehouse
 * @access Protected
 */
router.get(
  '/:warehouse_id',
  authorize(['view_warehouses', 'manage_warehouses']),
  getWarehouseInventoryDetailsController
);

module.exports = router;
