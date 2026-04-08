/**
 * @file product-batch-controller.js
 * @module controllers/product-batch-controller
 *
 * @description
 * Controllers for the Product Batch resource.
 *
 * Routes:
 *   GET   /api/v1/product-batches                          → getPaginatedProductBatchesController
 *   POST  /api/v1/product-batches                          → createProductBatchesController
 *   GET   /api/v1/product-batches/:batchId                 → getProductBatchDetailsController
 *   PATCH /api/v1/product-batches/:batchId/metadata        → editProductBatchMetadataController
 *   PATCH /api/v1/product-batches/:batchId/status          → updateProductBatchStatusController
 *   PATCH /api/v1/product-batches/:batchId/receive         → receiveProductBatchController
 *   PATCH /api/v1/product-batches/:batchId/release         → releaseProductBatchController
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
  fetchPaginatedProductBatchesService,
  createProductBatchesService,
  editProductBatchMetadataService,
  updateProductBatchStatusService,
  receiveProductBatchService,
  releaseProductBatchService,
  fetchProductBatchDetailsService,
} = require('../services/product-batch-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/product-batches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated product batch records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_PRODUCT_BATCHES permission.
 */
const getPaginatedProductBatchesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;
  
  const { data, pagination } = await fetchPaginatedProductBatchesService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
    user,
  });
  
  res.status(200).json({
    success:   true,
    message:   'Product batches retrieved successfully.',
    data,
    pagination,
    traceId:   req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/product-batches
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more product batches.
 *
 * Accepts a JSON array in req.body.productBatches.
 * Requires: auth middleware, Joi body validation, CREATE_PRODUCT_BATCHES permission.
 */
const createProductBatchesController = wrapAsyncHandler(async (req, res) => {
  const { productBatches } = req.body;
  const user               = req.auth.user;
  
  const result = await createProductBatchesService(productBatches, user);
  
  res.status(201).json({
    success: true,
    message: 'Product batches created successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/product-batches/:batchId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves full details for a specific product batch.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_PRODUCT_BATCHES permission.
 */
const getProductBatchDetailsController = wrapAsyncHandler(async (req, res) => {
  const { batchId } = req.params;
  
  const data = await fetchProductBatchDetailsService(batchId);
  
  res.status(200).json({
    success: true,
    message: 'Product batch details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/product-batches/:batchId/metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates metadata fields on a product batch.
 *
 * Requires: auth middleware, Joi body validation, EDIT_PRODUCT_BATCH permission.
 */
const editProductBatchMetadataController = wrapAsyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const user        = req.auth.user;
  
  const result = await editProductBatchMetadataService(batchId, req.body, user);
  
  res.status(200).json({
    success: true,
    message: 'Product batch updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/product-batches/:batchId/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the lifecycle status of a product batch.
 *
 * Requires: auth middleware, Joi body validation, UPDATE_PRODUCT_BATCH_STATUS permission.
 */
const updateProductBatchStatusController = wrapAsyncHandler(async (req, res) => {
  const { batchId }          = req.params;
  const { status_id, notes } = req.body;
  const user                 = req.auth.user;
  
  const result = await updateProductBatchStatusService(
    batchId,
    status_id,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Product batch status updated successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/product-batches/:batchId/receive
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Marks a product batch as received.
 *
 * Requires: auth middleware, Joi body validation, RECEIVE_PRODUCT_BATCH permission.
 */
const receiveProductBatchController = wrapAsyncHandler(async (req, res) => {
  const { batchId }            = req.params;
  const { received_at, notes } = req.body;
  const user                   = req.auth.user;
  
  const result = await receiveProductBatchService(
    batchId,
    received_at,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Product batch marked as received.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/product-batches/:batchId/release
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Releases a product batch back to a manufacturer.
 *
 * Requires: auth middleware, Joi body validation, RELEASE_PRODUCT_BATCH permission.
 */
const releaseProductBatchController = wrapAsyncHandler(async (req, res) => {
  const { batchId }                  = req.params;
  const { manufacturer_id, notes }   = req.body;
  const user                         = req.auth.user;
  
  const result = await releaseProductBatchService(
    batchId,
    manufacturer_id,
    notes,
    user,
  );
  
  res.status(200).json({
    success: true,
    message: 'Product batch released successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedProductBatchesController,
  createProductBatchesController,
  getProductBatchDetailsController,
  editProductBatchMetadataController,
  updateProductBatchStatusController,
  receiveProductBatchController,
  releaseProductBatchController,
};
