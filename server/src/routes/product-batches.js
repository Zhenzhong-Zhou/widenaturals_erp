/**
 * Product Batch Route Definitions
 *
 * This module defines Express routes for managing product batch records.
 *
 * Supported operations include:
 * - Listing product batches with pagination
 * - Creating new product batches
 * - Updating batch metadata
 * - Managing batch lifecycle transitions
 *
 * Lifecycle operations include:
 * - Updating batch status
 * - Marking batches as received (warehouse intake)
 * - Releasing batches for operational use
 *
 * Middleware pipeline order:
 *
 * 1. authorize
 *    Ensures the authenticated user has permission
 *    to perform the requested operation.
 *
 * 2. validate
 *    Validates incoming request parameters or body
 *    using Joi schemas.
 *
 * 3. controller
 *    Executes the request handler and delegates
 *    business logic to the service layer.
 *
 * Controllers remain thin and do not contain business logic.
 * Lifecycle rules, validation, and persistence are handled
 * in the service/business layers.
 */

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const { PRODUCT_BATCHES } = require('../utils/constants/domain/permissions');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const {
  productBatchQuerySchema,
  createProductBatchBulkSchema,
  editProductBatchMetadataSchema, updateProductBatchStatusSchema, receiveProductBatchSchema, releaseProductBatchSchema,
} = require('../validators/product-batch-validators');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  getPaginatedProductBatchesController,
  createProductBatchesController,
  editProductBatchMetadataController, updateProductBatchStatusController, receiveProductBatchController,
  releaseProductBatchController,
} = require('../controllers/product-batch-controller');

const router = express.Router();

/**
 * GET /product-batches
 *
 * Fetch a paginated list of PRODUCT batch records.
 *
 * Responsibilities by layer:
 *
 * - **Route Middleware**:
 *   - Enforces module-level access control (`PRODUCT_BATCH.VIEW`)
 *   - Normalizes query parameters (pagination, sorting, filters)
 *   - Sanitizes free-text inputs
 *   - Validates query shape and types (schema-level only)
 *
 * - **Controller**:
 *   - Coordinates request lifecycle, logging, and tracing
 *   - Delegates visibility resolution and pagination to the service layer
 *
 * - **Service / Business Layer**:
 *   - Evaluates product batch visibility rules
 *   - Applies visibility constraints to filters (fail-closed)
 *   - Executes paginated product batch queries
 *   - Delegates data normalization to the transformer layer
 *
 * Query behavior:
 * - `statusIds`, `skuIds`, `productIds`, `manufacturerIds`
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
  authorize([PRODUCT_BATCHES.VIEW_LIST]),
  createQueryNormalizationMiddleware(
    'productBatchSortMap',
    [
      // array-style filters
      'statusIds',
      'skuIds',
      'productIds',
      'manufacturerIds',
    ],
    [], // boolean filters (none client-controlled)
    productBatchQuerySchema, // query schema
    {},
    [], // option-level booleans
    [] // option-level strings
  ),
  sanitizeFields(['keyword', 'lotNumber']),
  validate(productBatchQuerySchema, 'query', {
    allowUnknown: true,
  }),
  getPaginatedProductBatchesController
);

/**
 * Creates one or more product batches.
 *
 * Middleware order:
 * 1. authorize → ensures the user has permission to create product batches
 * 2. validate → validates request payload using Joi schema
 * 3. controller → executes the batch creation workflow
 *
 * @route POST /product-batches/create
 *
 * @middleware authorize
 * Requires permission: PRODUCT_BATCHES.CREATE
 *
 * @middleware validate
 * Validates request body against `createProductBatchBulkSchema`
 *
 * @controller createProductBatchesController
 */
router.post(
  '/create',
  authorize([PRODUCT_BATCHES.CREATE]),
  validate(createProductBatchBulkSchema, 'body'),
  createProductBatchesController
);

/**
 * Update metadata of a product batch.
 *
 * Middleware pipeline:
 * 1. authorize → verifies the user has permission to edit product batches
 * 2. validate → validates request payload using Joi schema
 * 3. controller → executes metadata update workflow
 *
 * Route:
 * PATCH /product-batches/:batchId/metadata
 */
router.patch(
  '/:batchId/metadata',
  authorize([PRODUCT_BATCHES.EDIT]),
  validate(editProductBatchMetadataSchema, 'body'),
  editProductBatchMetadataController
);

//------------------------------------------------------------
// Update batch lifecycle status
//------------------------------------------------------------

/**
 * PATCH /:batchId/status
 *
 * Updates the lifecycle status of a product batch.
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
  authorize([PRODUCT_BATCHES.UPDATE_STATUS]),
  validate(updateProductBatchStatusSchema, 'body'),
  updateProductBatchStatusController
);

//------------------------------------------------------------
// Mark batch as received (warehouse intake)
//------------------------------------------------------------

/**
 * PATCH /:batchId/receive
 *
 * Marks a product batch as received into warehouse inventory.
 *
 * This operation typically transitions the lifecycle state:
 * pending → received
 *
 * The service layer applies lifecycle automation
 * such as setting received_at and received_by.
 */
router.patch(
  '/:batchId/receive',
  authorize([PRODUCT_BATCHES.RECEIVE]),
  validate(receiveProductBatchSchema, 'body'),
  receiveProductBatchController
);

//------------------------------------------------------------
// Release batch for operational use
//------------------------------------------------------------

/**
 * PATCH /:batchId/release
 *
 * Releases a product batch after quality inspection.
 *
 * Typical lifecycle transition:
 * received → released
 *
 * Releasing a batch indicates it is approved for
 * fulfillment, manufacturing, or distribution.
 */
router.patch(
  '/:batchId/release',
  authorize([PRODUCT_BATCHES.RELEASE]),
  validate(releaseProductBatchSchema, 'body'),
  releaseProductBatchController
);

module.exports = router;
