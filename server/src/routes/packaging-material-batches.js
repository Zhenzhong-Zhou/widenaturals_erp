/**
 * @file packaging-material-batches.js
 * @description Packaging material batch query, creation, and lifecycle management routes.
 * Covers paginated listing, bulk creation, metadata edits, and status transitions
 * (update, receive, release).
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  packagingMaterialBatchQuerySchema,
  packagingMaterialBatchIdParamSchema,
  createPackagingMaterialBatchBulkSchema,
  editPackagingMaterialBatchMetadataSchema,
  updatePackagingMaterialBatchStatusSchema,
  receivePackagingMaterialBatchSchema,
  releasePackagingMaterialBatchSchema,
} = require('../validators/packaging-material-batch-validators');
const {
  getPaginatedPackagingMaterialBatchesController,
  createPackagingMaterialBatchesController,
  editPackagingMaterialBatchMetadataController,
  updatePackagingMaterialBatchStatusController,
  receivePackagingMaterialBatchController,
  releasePackagingMaterialBatchController,
} = require('../controllers/packaging-material-batch-controller');

const router = express.Router();

/**
 * @route GET /packaging-material-batches
 * @description Paginated packaging material batch records with optional filters and sorting.
 * Filters: statusIds, packagingMaterialIds, supplierIds.
 * Sorting: sortBy, sortOrder (uses packagingMaterialBatchSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.VIEW_LIST
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.VIEW_LIST]),
  validate(packagingMaterialBatchQuerySchema, 'query', {
    allowUnknown: true, // downstream middleware normalizes unknown keys before business layer
  }),
  createQueryNormalizationMiddleware(
    'packagingMaterialBatchSortMap', // moduleKey — drives allowed sortBy fields
    [
      // arrayKeys — normalized as UUID arrays
      'statusIds',
      'packagingMaterialIds',
      'supplierIds',
    ],
    [], // booleanKeys — none client-controlled
    packagingMaterialBatchQuerySchema, // filterKeysOrSchema — extracts filter keys from schema
    {}, // options overrides — none
    [], // option-level booleans — none
    [] // option-level strings — none
  ),
  getPaginatedPackagingMaterialBatchesController
);

/**
 * @route POST /packaging-material-batches/create
 * @description Bulk create one or more packaging material batch records.
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.CREATE
 */
router.post(
  '/create',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.CREATE]),
  validate(createPackagingMaterialBatchBulkSchema, 'body'),
  createPackagingMaterialBatchesController
);

/**
 * @route PATCH /packaging-material-batches/:batchId/metadata
 * @description Update editable metadata fields on a packaging material batch.
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.EDIT
 */
router.patch(
  '/:batchId/metadata',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.EDIT]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(editPackagingMaterialBatchMetadataSchema, 'body'),
  editPackagingMaterialBatchMetadataController
);

/**
 * @route PATCH /packaging-material-batches/:batchId/status
 * @description Transition a packaging material batch to a new status.
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.UPDATE_STATUS
 */
router.patch(
  '/:batchId/status',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.UPDATE_STATUS]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(updatePackagingMaterialBatchStatusSchema, 'body'),
  updatePackagingMaterialBatchStatusController
);

/**
 * @route PATCH /packaging-material-batches/:batchId/receive
 * @description Record physical receipt of a packaging material batch into the warehouse.
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.RECEIVE
 */
router.patch(
  '/:batchId/receive',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.RECEIVE]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(receivePackagingMaterialBatchSchema, 'body'),
  receivePackagingMaterialBatchController
);

/**
 * @route PATCH /packaging-material-batches/:batchId/release
 * @description Release a packaging material batch for production use.
 * @access protected
 * @permission PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.RELEASE
 */
router.patch(
  '/:batchId/release',
  authorize([PERMISSION_KEYS.PACKAGING_MATERIAL_BATCHES.RELEASE]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(releasePackagingMaterialBatchSchema, 'body'),
  releasePackagingMaterialBatchController
);

module.exports = router;
