/**
 * @file sku-image-controller.js
 * @module controllers/sku-image-controller
 *
 * @description
 * Controllers for SKU image upload and update operations.
 *
 * Routes:
 *   POST  /api/v1/skus/images  → uploadSkuImagesController
 *   PATCH /api/v1/skus/images  → updateSkuImagesController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 *
 * Batch result shape:
 *   Both controllers return successCount and failureCount in the response
 *   because partial failure is possible in bulk image operations. The client
 *   needs this to display per-item feedback — it is part of the API contract,
 *   not internal instrumentation.
 *
 * Storage config (isProd, bucketName):
 *   Resolved inside the service layer — controllers do not read process.env.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  saveBulkSkuImagesService,
  updateBulkSkuImagesService,
} = require('../services/sku-image-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/skus/images
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Uploads images for one or more SKUs in bulk.
 *
 * Images are attached to req.body.skus by upstream middleware before this
 * controller executes. Partial failures are reflected in the response.
 *
 * Requires: auth middleware, image-processing middleware, UPLOAD_SKU_IMAGES permission.
 */
const uploadSkuImagesController = wrapAsyncHandler(async (req, res) => {
  const { skus } = req.body;
  const user = req.auth.user;

  const result = await saveBulkSkuImagesService(skus, user);
  const successCount = result.filter((r) => r.success).length;
  const failureCount = result.length - successCount;

  res.status(200).json({
    success: true,
    message: 'SKU image upload batch completed.',
    stats: {
      total: result.length,
      successCount,
      failureCount,
    },
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/skus/images
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates images for one or more SKUs in bulk.
 *
 * Partial failures are reflected in the response.
 * Requires: auth middleware, image-processing middleware, UPDATE_SKU_IMAGES permission.
 */
const updateSkuImagesController = wrapAsyncHandler(async (req, res) => {
  const { skus } = req.body;
  const user = req.auth.user;

  const result = await updateBulkSkuImagesService(skus, user);
  const successCount = result.filter((r) => r.success).length;
  const failureCount = result.length - successCount;

  res.status(200).json({
    success: true,
    message: 'SKU image update batch completed.',
    stats: {
      total: result.length,
      successCount,
      failureCount,
    },
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  uploadSkuImagesController,
  updateSkuImagesController,
};
