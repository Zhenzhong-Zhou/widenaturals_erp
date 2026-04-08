/**
 * @file packaging-material-batch-controller.js
 * @module controllers/packaging-material-batch-controller
 *
 * @description
 * Controllers for the Packaging Material Batch resource.
 *
 * Routes:
 *   GET   /api/v1/packaging-material-batches                      → getPaginatedPackagingMaterialBatchesController
 *   POST  /api/v1/packaging-material-batches                      → createPackagingMaterialBatchesController
 *   PATCH /api/v1/packaging-material-batches/:batchId/metadata    → editPackagingMaterialBatchMetadataController
 *   PATCH /api/v1/packaging-material-batches/:batchId/status      → updatePackagingMaterialBatchStatusController
 *   PATCH /api/v1/packaging-material-batches/:batchId/receive     → receivePackagingMaterialBatchController
 *   PATCH /api/v1/packaging-material-batches/:batchId/release     → releasePackagingMaterialBatchController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *   batchId is present in the URL — no controller-level logging needed.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  fetchPaginatedPackagingMaterialBatchesService,
  createPackagingMaterialBatchesService,
  editPackagingMaterialBatchMetadataService,
  updatePackagingMaterialBatchStatusService,
  receivePackagingMaterialBatchService,
  releasePackagingMaterialBatchService,
} = require('../services/packaging-material-batch-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/packaging-material-batches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated packaging material batch records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_PACKAGING_MATERIAL_BATCHES permission.
 */
const getPaginatedPackagingMaterialBatchesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;
  
  const { data, pagination } = await fetchPaginatedPackagingMaterialBatchesService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });
  
  res.status(200).json({
    success:  true,
    message:  'Packaging material batches retrieved successfully.',
    data,
    pagination,
    traceId:  req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/packaging-material-batches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more packaging material batches.
 *
 * Accepts a JSON array in req.body.packagingMaterialBatches.
 * Requires: auth middleware, Joi body validation, CREATE_PACKAGING_MATERIAL_BATCHES permission.
 */
const createPackagingMaterialBatchesController = wrapAsyncHandler(async (req, res) => {
  const { packagingMaterialBatches } = req.body;
  const user = req.auth.user;
  
  const result = await createPackagingMaterialBatchesService(
    packagingMaterialBatches,
    user,
  );
  
  res.status(201).json({
    success: true,
    message: 'Packaging material batches created successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/packaging-material-batches/:batchId/metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates metadata fields on a packaging material batch.
 *
 * Requires: auth middleware, Joi body validation, EDIT_PACKAGING_MATERIAL_BATCH permission.
 */
const editPackagingMaterialBatchMetadataController = wrapAsyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const user        = req.auth.user;
  
  const result = await editPackagingMaterialBatchMetadataService(
    batchId,
    req.body,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/packaging-material-batches/:batchId/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the lifecycle status of a packaging material batch.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_PACKAGING_MATERIAL_BATCH_STATUS permission.
 */
const updatePackagingMaterialBatchStatusController = wrapAsyncHandler(async (req, res) => {
  const { batchId }          = req.params;
  const { status_id, notes } = req.body;
  const user                 = req.auth.user;
  
  const result = await updatePackagingMaterialBatchStatusService(
    batchId,
    status_id,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch status updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/packaging-material-batches/:batchId/receive
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks a packaging material batch as received.
 *
 * Requires: auth middleware, Joi body validation, RECEIVE_PACKAGING_MATERIAL_BATCH permission.
 */
const receivePackagingMaterialBatchController = wrapAsyncHandler(async (req, res) => {
  const { batchId }              = req.params;
  const { received_at, notes }   = req.body;
  const user                     = req.auth.user;
  
  const result = await receivePackagingMaterialBatchService(
    batchId,
    received_at,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch marked as received.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/packaging-material-batches/:batchId/release
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Releases a packaging material batch back to a supplier.
 *
 * Requires: auth middleware, Joi body validation, RELEASE_PACKAGING_MATERIAL_BATCH permission.
 */
const releasePackagingMaterialBatchController = wrapAsyncHandler(async (req, res) => {
  const { batchId }              = req.params;
  const { supplier_id, notes }   = req.body;
  const user                     = req.auth.user;
  
  const result = await releasePackagingMaterialBatchService(
    batchId,
    supplier_id,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Packaging material batch released successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedPackagingMaterialBatchesController,
  createPackagingMaterialBatchesController,
  editPackagingMaterialBatchMetadataController,
  updatePackagingMaterialBatchStatusController,
  receivePackagingMaterialBatchController,
  releasePackagingMaterialBatchController,
};
