/**
 * @fileoverview
 * Controller for handling SKU image uploads — both single and bulk.
 * Automatically adapts to single or multiple SKUs and delegates
 * processing to `saveBulkSkuImagesService`.
 */

const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const { saveBulkSkuImagesService } = require('../services/sku-image-service');

/**
 * @async
 * @function
 * @description
 * Handles the final execution of SKU image uploads after request normalization
 * and validation have been completed by middlewares.
 *
 * Responsibilities:
 *  - Assumes `req.body.skus` is already normalized and validated.
 *  - Delegates all processing to `saveBulkSkuImagesService`.
 *  - Logs batch execution details.
 *  - Returns standardized response payload including summary stats.
 *
 * Notes:
 *  - This controller does NOT perform JSON parsing or file-to-SKU mapping.
 *    Those tasks are handled by upstream middlewares:
 *      • parseSkuImageJson
 *      • attachUploadedFilesToSkus
 *      • validate(bulkSkuImageUploadSchema)
 *  - Ensures the controller stays thin, testable, and consistent with
 *    service-oriented architecture.
 */
const uploadSkuImagesController = wrapAsync(async (req, res) => {
  const context = 'sku-image-controller/uploadSkuImagesController';
  const startTime = Date.now();

  const { skus } = req.body;
  const user = req.auth.user;

  const isProd = process.env.NODE_ENV === 'production';
  const bucketName = process.env.S3_BUCKET_NAME;
  const traceId = `upload-${Date.now().toString(36)}`;

  logInfo('Starting SKU image upload request', req, {
    context,
    traceId,
    userId: user.id,
    skuCount: skus.length,
    mode: isProd ? 'production' : 'development',
  });

  // Images are already fully attached by middleware
  const result = await saveBulkSkuImagesService(skus, user, isProd, bucketName);

  const elapsedMs = Date.now() - startTime;
  const successCount = result.filter((r) => r.success).length;
  const failureCount = result.length - successCount;

  logInfo('Completed SKU image upload batch', req, {
    context,
    traceId,
    total: result.length,
    successCount,
    failureCount,
    elapsedMs,
  });

  res.status(200).json({
    success: true,
    message: 'SKU image upload batch completed successfully.',
    stats: {
      total: result.length,
      successCount,
      failureCount,
      elapsedMs,
    },
    data: result,
  });
});

module.exports = {
  uploadSkuImagesController,
};
