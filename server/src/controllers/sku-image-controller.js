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
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/skus/images
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Uploads images for one or more SKUs in bulk.
 *
 * Parses SKU metadata from the multipart request body, matches uploaded files
 * from req.files to image entries marked as uploaded, and passes the merged
 * SKU/image payload to the bulk image upload service.
 *
 * File matching is order-based: the frontend must send files in the same order
 * as image entries where `source === 'uploaded'` and `file_uploaded === true`.
 *
 * Partial service-level failures are reflected in the response. Request-level
 * validation errors, such as missing or extra uploaded files, abort the request.
 *
 * Requires: auth middleware, multipart upload middleware, UPLOAD_SKU_IMAGES permission.
 */
const uploadSkuImagesController = wrapAsyncHandler(async (req, res) => {
  // Multer + multipart means JSON fields arrive as strings, not objects.
  const skus = typeof req.body.skus === 'string'
    ? JSON.parse(req.body.skus)
    : req.body.skus;
  
  const files = req.files ?? [];
  const user = req.auth.user;
  
  // Walk the metadata in order and attach files to every "uploaded" slot.
  // Frontend must send files in the same order as `file_uploaded: true` entries.
  let fileCursor = 0;
  const merged = skus.map((set) => ({
    ...set,
    images: set.images.map((img) => {
      if (img.source === 'uploaded' && img.file_uploaded) {
        const file = files[fileCursor++];
        if (!file) {
          throw AppError.validationError(
            `Missing uploaded file for SKU ${set.skuCode} at image index.`
          );
        }
        return { ...img, file };
      }
      return img; // URL-based slot, untouched
    }),
  }));
  
  if (fileCursor !== files.length) {
    throw AppError.validationError(
      `Mismatch: ${files.length} files uploaded, ${fileCursor} consumed.`
    );
  }
  
  const result = await saveBulkSkuImagesService(merged, user);
  const successCount = result.reduce((n, r) => n + (r.success ? 1 : 0), 0);
  const failureCount = result.length - successCount;
  
  const status = failureCount === 0 ? 200 : 207;
  res.status(status).json({
    success: failureCount === 0,
    message:
      failureCount === 0
        ? 'All SKU images uploaded successfully.'
        : successCount === 0
          ? 'All SKU image uploads failed.'
          : `SKU image upload completed with ${failureCount} failure(s).`,
    stats: { total: result.length, successCount, failureCount },
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
 * Parses SKU metadata from the multipart request body, matches uploaded files
 * from req.files to image entries marked as uploaded, and passes the merged
 * SKU/image payload to the bulk image update service.
 *
 * File matching is order-based: the frontend must send files in the same order
 * as image entries where `source === 'uploaded'` and `file_uploaded === true`.
 *
 * Partial service-level failures are returned in the response stats and data.
 * Request-level validation errors, such as missing or extra uploaded files,
 * abort the request.
 *
 * Requires: auth middleware, multipart upload middleware, UPDATE_SKU_IMAGES permission.
 */
const updateSkuImagesController = wrapAsyncHandler(async (req, res) => {
  const skus = typeof req.body.skus === 'string'
    ? JSON.parse(req.body.skus)
    : req.body.skus;
  
  const files = req.files ?? [];
  const user = req.auth.user;
  
  let fileCursor = 0;
  const merged = skus.map((set) => ({
    ...set,
    images: set.images.map((img) => {
      if (img.source === 'uploaded' && img.file_uploaded) {
        const file = files[fileCursor++];
        if (!file) {
          throw AppError.validationError(
            `Missing uploaded file for SKU ${set.skuCode}, group ${img.group_id}.`
          );
        }
        return { ...img, file };
      }
      return img;
    }),
  }));
  
  if (fileCursor !== files.length) {
    throw AppError.validationError(
      `Mismatch: ${files.length} files uploaded, ${fileCursor} consumed.`
    );
  }
  
  const result = await updateBulkSkuImagesService(merged, user);
  const successCount = result.filter((r) => r.success).length;
  const failureCount = result.length - successCount;
  
  const status = failureCount === 0 ? 200 : 207;
  
  res.status(status).json({
    success: failureCount === 0,
    message:
      failureCount === 0
        ? 'All SKU images updated successfully.'
        : successCount === 0
          ? 'All SKU image updates failed.'
          : `SKU image update completed with ${failureCount} failure(s).`,
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
