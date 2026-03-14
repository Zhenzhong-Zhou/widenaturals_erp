const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { PACKAGING_MATERIAL_BATCHES } = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  packagingMaterialBatchQuerySchema,
  createPackagingMaterialBatchBulkSchema,
  editPackagingMaterialBatchMetadataSchema,
  updatePackagingMaterialBatchStatusSchema,
  receivePackagingMaterialBatchSchema,
  releasePackagingMaterialBatchSchema, packagingMaterialBatchIdParamSchema,
} = require('../validators/packaging-material-batch-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
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
 * GET /packaging-material-batches
 *
 * Fetch a paginated list of PACKAGING MATERIAL batch records.
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`PACKAGING_BATCH.VIEW_LIST`)
 *   - Normalizes query parameters (pagination, sorting, filters)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Coordinates request lifecycle, logging, and tracing
 *   - Delegates visibility resolution and pagination to the service layer
 *
 * - **Service / Business Layer**:
 *   - Evaluates packaging material batch visibility rules
 *   - Applies visibility constraints to filters (fail-closed)
 *   - Executes paginated PMB queries
 *   - Delegates data normalization to the transformer layer
 *
 * Query behavior:
 * - `statusIds`, `packagingMaterialIds`, `supplierIds`
 *   → normalized as UUID arrays
 *
 * - `lotNumber`
 *   → explicit lot filter (ILIKE)
 *
 * - Date filters
 *   → expiry / manufacture / received / created ranges
 *
 * - Pagination & sorting
 *   → normalized and SQL-safe via upstream middleware
 *
 * - `keyword`
 *   → free-text search
 *   → eligible fields determined by ACL (NOT client input)
 *
 * This route does NOT:
 * - Perform business logic
 * - Enforce row-level visibility
 * - Shape response data
 * - Decide keyword search scope
 */
router.get(
  '/',
  authorize([PACKAGING_MATERIAL_BATCHES.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'packagingMaterialBatchSortMap',
    [
      // array-style filters
      'statusIds',
      'packagingMaterialIds',
      'supplierIds',
    ],
    [], // boolean filters (none client-controlled)
    packagingMaterialBatchQuerySchema, // query schema
    {},
    [], // option-level booleans
    [] // option-level strings
  ),
  sanitizeFields(['keyword', 'lotNumber']),
  validate(packagingMaterialBatchQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedPackagingMaterialBatchesController
);

/**
 * Creates one or more packaging material batches.
 *
 * Middleware order:
 * 1. authorize → ensures the user has permission to create packaging batches
 * 2. validate → validates request payload using Joi schema
 * 3. controller → executes the batch creation workflow
 *
 * @route POST /packaging-material-batches/create
 *
 * @middleware authorize
 * Requires permission: PACKAGING_MATERIAL_BATCHES.CREATE
 *
 * @middleware validate
 * Validates request body against `createPackagingMaterialBatchBulkSchema`
 *
 * @controller createPackagingMaterialBatchesController
 */
router.post(
  '/create',
  authorize([PACKAGING_MATERIAL_BATCHES.CREATE]),
  validate(createPackagingMaterialBatchBulkSchema, 'body'),
  createPackagingMaterialBatchesController
);

/**
 * Update metadata of a packaging material batch.
 *
 * Middleware pipeline:
 * 1. authorize → verifies the user has permission to edit packaging batches
 * 2. validate → validates request payload using Joi schema
 * 3. controller → executes metadata update workflow
 *
 * Route:
 * PATCH /packaging-material-batches/:batchId/metadata
 */
router.patch(
  '/:batchId/metadata',
  authorize([PACKAGING_MATERIAL_BATCHES.EDIT]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(editPackagingMaterialBatchMetadataSchema, 'body'),
  editPackagingMaterialBatchMetadataController
);

//------------------------------------------------------------
// Update packaging material batch lifecycle status
//------------------------------------------------------------

/**
 * PATCH /:batchId/status
 *
 * Updates the lifecycle status of a packaging material batch.
 *
 * Example transitions:
 * - pending → received
 * - received → quarantined
 * - quarantined → released
 *
 * Middleware flow:
 * 1. Permission check
 * 2. Request body validation
 * 3. Controller execution
 */
router.patch(
  '/:batchId/status',
  authorize([PACKAGING_MATERIAL_BATCHES.UPDATE_STATUS]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(updatePackagingMaterialBatchStatusSchema, 'body'),
  updatePackagingMaterialBatchStatusController
);

//------------------------------------------------------------
// Mark packaging batch as received (warehouse intake)
//------------------------------------------------------------

/**
 * PATCH /:batchId/receive
 *
 * Marks a packaging material batch as received into warehouse inventory.
 *
 * This operation typically transitions the lifecycle state:
 * pending → received
 *
 * The service layer applies lifecycle automation
 * such as setting received_at and received_by.
 */
router.patch(
  '/:batchId/receive',
  authorize([PACKAGING_MATERIAL_BATCHES.RECEIVE]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(receivePackagingMaterialBatchSchema, 'body'),
  receivePackagingMaterialBatchController
);

//------------------------------------------------------------
// Release packaging batch for operational use
//------------------------------------------------------------

/**
 * PATCH /:batchId/release
 *
 * Releases a packaging material batch after quality inspection.
 *
 * Typical lifecycle transition:
 * received → released
 *
 * Releasing a batch indicates it is approved for
 * manufacturing or packaging operations.
 */
router.patch(
  '/:batchId/release',
  authorize([PACKAGING_MATERIAL_BATCHES.RELEASE]),
  validate(packagingMaterialBatchIdParamSchema, 'params'),
  validate(releasePackagingMaterialBatchSchema, 'body'),
  releasePackagingMaterialBatchController
);

module.exports = router;
