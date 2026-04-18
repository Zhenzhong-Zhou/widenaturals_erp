/**
 * @file warehouse-inventory-routes.js
 * @description
 * Express routes for warehouse inventory endpoints.
 * All routes are protected and require a valid authenticated session.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  getPaginatedWarehouseInventoryController,
  createWarehouseInventoryController,
  adjustWarehouseInventoryQuantityController,
  updateWarehouseInventoryStatusController,
  updateWarehouseInventoryMetadataController,
  recordWarehouseInventoryOutboundController,
  getWarehouseInventoryDetailController,
  getWarehouseSummaryController,
  getWarehouseItemSummaryController,
} = require('../controllers/warehouse-inventory-controller');
const validate = require('../middlewares/validate');
const {
  warehouseIdParamSchema,
} = require('../validators/warehouse-validators');
const {
  warehouseInventoryQuerySchema,
  createWarehouseInventoryBulkSchema,
  adjustWarehouseInventoryQuantitySchema,
  updateWarehouseInventoryStatusSchema,
  inventoryIdParamSchema,
  updateWarehouseInventoryMetadataSchema,
  recordWarehouseInventoryOutboundSchema,
  warehouseItemSummaryQuerySchema,
} = require('../validators/warehouse-inventory-validators');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const {
  inventoryActivityLogQuerySchema,
} = require('../validators/inventory-activity-log-validators');
const {
  getPaginatedActivityLogController,
} = require('../controllers/inventory-activity-log-controller');

const router = express.Router();

/**
 * @route GET /:warehouseId/inventory
 * @description Paginated warehouse inventory records for a given warehouse.
 *   Filters: statusId, batchType, skuId, productId, packagingMaterialId,
 *   inboundDateAfter, inboundDateBefore, hasReserved, lowStockThreshold,
 *   expiringWithinDays, search.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW
 */
router.get(
  '/:warehouseId/inventory',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW]),
  validate(warehouseIdParamSchema, 'params'),
  validate(warehouseInventoryQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'warehouseInventorySortMap',
    [], // arrayKeys
    ['hasReserved'], // booleanKeys
    warehouseInventoryQuerySchema,
    {}, // filterDefaults
    [], // dateRangeKeys
    ['lowStockThreshold', 'expiringWithinDays'] // numericKeys
  ),
  getPaginatedWarehouseInventoryController
);

/**
 * @route POST /:warehouseId/inventory
 * @description Bulk create warehouse inventory records for a given warehouse.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE
 */
router.post(
  '/:warehouseId/inventory',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE]),
  validate(warehouseIdParamSchema, 'params'),
  validate(createWarehouseInventoryBulkSchema, 'body'),
  createWarehouseInventoryController
);

/**
 * @route PATCH /:warehouseId/inventory/quantities
 * @description Bulk adjust warehouse and reserved quantities for inventory records.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.ADJUST_INVENTORY
 */
router.patch(
  '/:warehouseId/inventory/quantities',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.ADJUST_INVENTORY]),
  validate(warehouseIdParamSchema, 'params'),
  validate(adjustWarehouseInventoryQuantitySchema, 'body'),
  adjustWarehouseInventoryQuantityController
);

/**
 * @route PATCH /:warehouseId/inventory/statuses
 * @description Bulk update inventory status for a set of inventory records.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.UPDATE_INVENTORY_STATUS
 */
router.patch(
  '/:warehouseId/inventory/statuses',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.UPDATE_INVENTORY_STATUS]),
  validate(warehouseIdParamSchema, 'params'),
  validate(updateWarehouseInventoryStatusSchema, 'body'),
  updateWarehouseInventoryStatusController
);

/**
 * @route PATCH /:warehouseId/inventory/:inventoryId/metadata
 * @description Update inbound date and warehouse fee for a single inventory record.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.ADJUST_INVENTORY
 */
router.patch(
  '/:warehouseId/inventory/:inventoryId/metadata',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.ADJUST_INVENTORY]),
  validate(inventoryIdParamSchema, 'params'),
  validate(updateWarehouseInventoryMetadataSchema, 'body'),
  updateWarehouseInventoryMetadataController
);

/**
 * @route POST /:warehouseId/inventory/outbound
 * @description Record outbound stock movement for one or more inventory records.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE_OUTBOUND
 */
router.post(
  '/:warehouseId/inventory/outbound',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.CREATE_OUTBOUND]),
  validate(warehouseIdParamSchema, 'params'),
  validate(recordWarehouseInventoryOutboundSchema, 'body'),
  recordWarehouseInventoryOutboundController
);

/**
 * @route GET /:warehouseId/inventory/activity-log
 * @description Paginated inventory activity log scoped to a given warehouse.
 *   Filters: inventoryId, actionTypeId, performedBy, dateAfter, dateBefore.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW
 */
router.get(
  '/:warehouseId/inventory/activity-log',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW]),
  validate(warehouseIdParamSchema, 'params'),
  validate(inventoryActivityLogQuerySchema, 'query', { allowUnknown: true }),
  createQueryNormalizationMiddleware(
    'inventoryActivityLogSortMap',
    [],
    [],
    inventoryActivityLogQuerySchema,
    {},
    [],
    []
  ),
  getPaginatedActivityLogController
);

/**
 * @route GET /:warehouseId/inventory/:inventoryId
 * @description Full detail view for a single warehouse inventory record,
 *   including zone assignments and recent movement history.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW
 */
router.get(
  '/:warehouseId/inventory/:inventoryId',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW]),
  validate(inventoryIdParamSchema, 'params'),
  getWarehouseInventoryDetailController
);

/**
 * @route GET /:warehouseId/summary
 * @description Warehouse-level inventory summary including quantity totals,
 *   batch-type breakdown, and per-status breakdown.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY
 */
router.get(
  '/:warehouseId/summary',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY]),
  validate(warehouseIdParamSchema, 'params'),
  getWarehouseSummaryController
);

/**
 * @route GET /:warehouseId/summary/items
 * @description Paginated product and packaging material inventory summary
 *   for a given warehouse, with optional batch-type filtering.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY_ITEM_DETAILS
 */
router.get(
  '/:warehouseId/summary/items',
  authorize([PERMISSION_KEYS.WAREHOUSE_INVENTORY.VIEW_SUMMARY_ITEM_DETAILS]),
  validate(warehouseIdParamSchema, 'params'),
  validate(warehouseItemSummaryQuerySchema, 'query'),
  getWarehouseItemSummaryController
);

module.exports = router;
