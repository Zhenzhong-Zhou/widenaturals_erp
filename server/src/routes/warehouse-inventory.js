const express = require('express');
const {
  getPaginatedWarehouseInventorySummaryController,
  getWarehouseInventorySummaryDetailsController,
  getWarehouseInventoryRecordController, createWarehouseInventoryRecordController,
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

/**
 * @route GET /warehouse-inventory
 * @group Warehouse Inventory - Inventory overview at the warehouse level
 * @middleware authorize - Ensures the user has appropriate permissions
 * @middleware sanitizeInput - Sanitizes input query parameters to prevent injection
 *
 * @permissions
 * Requires one of the following permissions:
 * - view_warehouses
 * - manage_warehouses
 * - view_inventory
 * - view_warehouse_inventory
 * - view_product_inventory
 * - view_material_inventory
 *
 * @queryparam {number} [page=1] - Page number for pagination (1-based)
 * @queryparam {number} [limit=20] - Number of records per page
 * @queryparam {string} [sortBy] - Field to sort by (e.g., 'productName', 'expiryDate')
 * @queryparam {string} [sortOrder=ASC] - Sort direction ('ASC' or 'DESC')
 *
 * @queryparam {string} [batchType] - Filter by batch type ('product' | 'packaging_material')
 * @queryparam {string} [warehouseName] - Filter by warehouse name (ILIKE match)
 * @queryparam {string} [productName] - Filter by product name (ILIKE match)
 * @queryparam {string} [materialName] - Filter by material name (ILIKE match)
 * @queryparam {string} [sku] - Filter by SKU code
 * @queryparam {string} [lotNumber] - Filter by lot number
 * @queryparam {string} [status] - Filter by inventory status
 * @queryparam {string} [createdAt] - Filter by creation date (YYYY-MM-DD)
 *
 * @returns {200} JSON object containing paginated warehouse inventory records
 */
router.get(
  '/',
  authorize([
    'view_warehouses',
    'manage_warehouses',
    'view_inventory',
    'view_warehouse_inventory',
    'view_product_inventory',
    'view_material_inventory'
  ]),
  sanitizeInput,
  getWarehouseInventoryRecordController
);

/**
 * @route POST /warehouse-inventory
 * @group Warehouse Inventory - Operations related to warehouse and location inventory
 * @summary Create new inventory records for both warehouse and location
 * @description
 * This endpoint handles the creation of inventory records, including both warehouse and location-level entries.
 * It performs:
 * - Validation of batch registry entries
 * - Insertion of inventory records (warehouse and location)
 * - Logging of inventory activity in the inventory log tables
 *
 * Requires permission: `manage_warehouse_inventory`
 *
 * Request body should contain an array of inventory records, each with:
 * - `warehouse_id`: UUID of the warehouse
 * - `location_id`: UUID of the location
 * - `batch_id`: UUID from batch_registry
 * - `batch_type`: Either `'product'` or `'packaging_material'`
 * - `quantity`: Number
 * - `inventory_action_type_id`: UUID (e.g., for 'initial load')
 * - `adjustment_type_id`: (Optional) UUID for adjustment reason
 * - `status_id`: (Optional) UUID for inventory status
 * - `inbound_date`: Date string (ISO format)
 * - `created_by`: UUID of the user performing the action
 *
 * @returns {Object} 200 - Created inventory records (grouped by warehouse and location)
 * @returns {Error} 400 - Validation error
 * @returns {Error} 500 - Server or service error
 */
router.post(
  '/',
  authorize(['manage_warehouse_inventory']), // Suggested permission
  sanitizeInput,
  createWarehouseInventoryRecordController
);

module.exports = router;
