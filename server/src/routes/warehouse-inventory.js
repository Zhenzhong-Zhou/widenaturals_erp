const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { WAREHOUSE_INVENTORY } = require('../utils/constants/domain/permissions');
const {
  getWarehouseInventoryRecordController,
  createWarehouseInventoryRecordController,
  adjustInventoryQuantitiesController, getPaginatedWarehouseInventoryController,
} = require('../controllers/warehouse-inventory-controller');
const validate = require('../middlewares/validate');
const { warehouseInventoryQuerySchema } = require('../validators/warehouse-inventory-validators');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');

const router = express.Router();

/**
 * @route GET /:warehouseId/inventory
 * @description Paginated warehouse inventory records for a given warehouse.
 *   Filters: statusId, batchType, skuId, productId, packagingMaterialId,
 *   inboundDateAfter, inboundDateBefore, hasReserved, search.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.VIEW
 */
router.get(
  '/:warehouseId/inventory',
  authorize([WAREHOUSE_INVENTORY.VIEW]),
  validate(warehouseInventoryQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'warehouseInventorySortMap',
    [],              // arrayKeys        — none, all single UUIDs
    ['hasReserved'], // booleanKeys
    warehouseInventoryQuerySchema,
    {},              // filterDefaults
    [],              // dateRangeKeys
    []               // numericKeys
  ),
  getPaginatedWarehouseInventoryController
);

/**
 * @route GET /warehouse-inventory
 * @group Warehouse Inventory - Inventory overview at the warehouse level
 * @middleware authorize - Ensures the user has appropriate permissions
 * @middleware sanitizeInput - Sanitizes input query parameters to prevent injection
 *
 * @permissions
 * Requires one of the following permissions:
 * - view_warehouse_inventory
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
  authorize([WAREHOUSE_INVENTORY.VIEW]),
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
  authorize([WAREHOUSE_INVENTORY.CREATE]),
  createWarehouseInventoryRecordController
);

/**
 * @route PATCH /warehouse-inventory/adjust-quantities
 * @description Adjusts inventory quantities for warehouse and location inventory records.
 *              Supports bulk updates (up to 20 records), with automatic deduplication and validation.
 *              Also logs inventory activity with status changes and action metadata.
 *
 * @permissions Required:
 *   - manage_inventory
 *   - adjust_inventory
 *   - manage_warehouses
 *   - manage_warehouse_inventory
 *
 * @body {Array<Object>} records - List of inventory adjustment records.
 * Each record must include:
 *   - batch_type: 'product' | 'packaging_material'
 *   - batch_id: string
 *   - quantity: number
 *   - warehouse_id or location_id: string
 *   - inventory_action_type_id: string
 *   - adjustment_type_id: string (optional)
 *   - comments: string (optional)
 *   - meta: object (optional)
 *
 * @returns {Object} Result containing updated inventory and log records.
 */
router.patch(
  '/adjust-quantities',
  authorize([WAREHOUSE_INVENTORY.ADJUST]),
  adjustInventoryQuantitiesController
);

module.exports = router;
