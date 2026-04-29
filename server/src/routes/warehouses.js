/**
 * @file warehouses.js
 * @description Express routes for warehouse endpoints.
 *
 * All routes are protected and require a valid authenticated session.
 * Query normalisation and permission enforcement are handled by middleware.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS                    = require('../utils/constants/domain/permission-keys');
const {
  warehouseIdParamSchema,
  warehouseQuerySchema,
} = require('../validators/warehouse-validators');
const {
  getPaginatedWarehousesController,
  getWarehouseDetailController,
} = require('../controllers/warehouse-controller');

const router = express.Router();

/**
 * @route GET /warehouses
 * @description Paginated warehouse list with inventory summary stats per warehouse.
 *   Filters: statusId, isArchived, warehouseTypeId, locationId, name, code,
 *   createdBy, updatedBy, createdAfter, createdBefore, updatedAfter, updatedBefore, keyword.
 *   Sorting: warehouseName, warehouseCode, locationName, totalQuantity, createdAt.
 * @access protected
 * @permission PERMISSION_KEYS.WAREHOUSES.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.WAREHOUSES.VIEW]),
  validate(warehouseQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'warehouseSortMap',      // moduleKey       — drives allowed sortBy fields
    [],                      // arrayKeys        — none, all single-value filters
    ['isArchived'],          // booleanKeys      — normalised to true/false
    warehouseQuerySchema     // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedWarehousesController
);

/**
 * @route GET /warehouses/:warehouseId/details
 * @description Full warehouse detail including address, location type, and inventory summary.
 * @access protected
 * @permission PERMISSION_KEYS. WAREHOUSES.VIEW_DETAILS
 */
router.get(
  '/:warehouseId/details',
  authorize([PERMISSION_KEYS.WAREHOUSES.VIEW_DETAILS]),
  validate(warehouseIdParamSchema, 'params'),
  getWarehouseDetailController
);

module.exports = router;
