/**
 * @file warehouse-inventory-routes.js
 * @description
 * Express routes for warehouse inventory endpoints.
 * All routes are protected and require a valid authenticated session.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { WAREHOUSE_INVENTORY } = require('../utils/constants/domain/permissions');
const {
  getPaginatedWarehouseInventoryController,
  createWarehouseInventoryController,
  adjustWarehouseInventoryQuantityController,
  updateWarehouseInventoryStatusController,
  updateWarehouseInventoryMetadataController,
  recordWarehouseInventoryOutboundController,
  getWarehouseInventoryDetailController,
} = require('../controllers/warehouse-inventory-controller');
const validate = require('../middlewares/validate');
const { warehouseIdParamSchema } = require('../validators/warehouse-validators');
const {
  warehouseInventoryQuerySchema,
  createWarehouseInventoryBulkSchema,
  adjustWarehouseInventoryQuantitySchema,
  updateWarehouseInventoryStatusSchema,
  inventoryIdParamSchema,
  updateWarehouseInventoryMetadataSchema,
  recordWarehouseInventoryOutboundSchema
} = require('../validators/warehouse-inventory-validators');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const { inventoryActivityLogQuerySchema } = require('../validators/report-validators');
const { getPaginatedActivityLogController } = require('../controllers/inventory-activity-log-controller');

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
  validate(warehouseIdParamSchema, 'params'),
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
 * @route POST /:warehouseId/inventory
 * @description Bulk create warehouse inventory records for a given warehouse.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.CREATE
 */
router.post(
  '/:warehouseId/inventory',
  authorize([WAREHOUSE_INVENTORY.CREATE]),
  validate(warehouseIdParamSchema, 'params'),
  validate(createWarehouseInventoryBulkSchema, 'body'),
  createWarehouseInventoryController
);

/**
 * @route PATCH /:warehouseId/inventory/quantities
 * @description Bulk adjust warehouse and reserved quantities for inventory records.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.ADJUST_INVENTORY
 */
router.patch(
  '/:warehouseId/inventory/quantities',
  authorize([WAREHOUSE_INVENTORY.ADJUST_INVENTORY]),
  validate(warehouseIdParamSchema, 'params'),
  validate(adjustWarehouseInventoryQuantitySchema, 'body'),
  adjustWarehouseInventoryQuantityController
);

/**
 * @route PATCH /:warehouseId/inventory/statuses
 * @description Bulk update inventory status for a set of inventory records.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.UPDATE_INVENTORY_STATUS
 */
router.patch(
  '/:warehouseId/inventory/statuses',
  authorize([WAREHOUSE_INVENTORY.UPDATE_INVENTORY_STATUS]),
  validate(warehouseIdParamSchema, 'params'),
  validate(updateWarehouseInventoryStatusSchema, 'body'),
  updateWarehouseInventoryStatusController
);

/**
 * @route PATCH /:warehouseId/inventory/:inventoryId/metadata
 * @description Update inbound date and warehouse fee for a single inventory record.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.ADJUST_INVENTORY
 */
router.patch(
  '/:warehouseId/inventory/:inventoryId/metadata',
  authorize([WAREHOUSE_INVENTORY.ADJUST_INVENTORY]),
  validate(inventoryIdParamSchema, 'params'),
  validate(updateWarehouseInventoryMetadataSchema, 'body'),
  updateWarehouseInventoryMetadataController
);

/**
 * @route POST /:warehouseId/inventory/outbound
 * @description Record outbound stock movement for one or more inventory records.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.CREATE_OUTBOUND
 */
router.post(
  '/:warehouseId/inventory/outbound',
  authorize([WAREHOUSE_INVENTORY.CREATE_OUTBOUND]),
  validate(warehouseIdParamSchema, 'params'),
  validate(recordWarehouseInventoryOutboundSchema, 'body'),
  recordWarehouseInventoryOutboundController
);

/**
 * @route GET /:warehouseId/inventory/:inventoryId
 * @description Full detail view for a single warehouse inventory record,
 *   including zone assignments and recent movement history.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.READ
 */
router.get(
  '/:warehouseId/inventory/:inventoryId',
  authorize([WAREHOUSE_INVENTORY.READ]),
  validate(inventoryIdParamSchema, 'params'),
  getWarehouseInventoryDetailController
);

/**
 * @route GET /:warehouseId/inventory/activity-log
 * @description Paginated inventory activity log scoped to a given warehouse.
 *   Filters: inventoryId, actionTypeId, performedBy, dateAfter, dateBefore.
 * @access protected
 * @permission WAREHOUSE_INVENTORY.READ
 */
router.get(
  '/:warehouseId/inventory/activity-log',
  authorize([WAREHOUSE_INVENTORY.READ]),
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

module.exports = router;
