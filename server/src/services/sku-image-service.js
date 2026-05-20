/**
 * @file sku-image-service.js
 * @description Business logic for SKU image processing, upload, update, and persistence.
 *
 * This service handles:
 *  - processing uploaded or URL-based SKU images into main/thumbnail/zoom variants
 *  - saving image variants for one SKU inside an existing transaction
 *  - updating existing image groups for one SKU inside an existing transaction
 *  - bulk save/update workflows with per-SKU transaction isolation
 *
 * Exports:
 *  - processAndUploadSkuImages  — processes and uploads image variants for a single SKU
 *  - saveBulkSkuImagesService   — saves images for multiple SKUs with per-SKU isolation
 *  - updateBulkSkuImagesService — updates images for multiple SKUs with per-SKU isolation
 *
 * Logging and error-handling policy:
 *  - Per-image failures inside `processAndUploadSkuImages` are logged with
 *    `logSystemException` because the function intentionally skips failed images
 *    and continues processing the remaining images.
 *  - Per-SKU failures inside bulk `Promise.allSettled` workflows are logged with
 *    `logSystemException` because failures are converted into response data and
 *    do not reach `globalErrorHandler`.
 *  - `reprocessUpdatedSkuImages` does not log directly. It rethrows expected
 *    AppErrors and wraps unexpected errors so the SKU-level transaction can fail
 *    atomically.
 *  - Unexpected errors outside fault-tolerant paths are wrapped as AppError
 *    service errors and are left for the caller/global error handler to log once.
 */

'use strict';

const os = require('os');
const pLimit = require('p-limit').default;
const { logSystemException } = require('../utils/logging/system-logger');
const {
  getSkuImageDisplayOrderBase,
  hasPrimaryMainImage,
  insertSkuImagesBulk,
  getSkuImageGroupIdsBySku,
  updateSkuImagesBulk,
} = require('../repositories/sku-image-repository');
const { processWithConcurrencyLimit } = require('../utils/concurrency-utils');
const AppError = require('../utils/AppError');
const { normalizeSkuImageForInsert } = require('../business/sku-image-buiness');
const {
  transformGroupedSkuImages,
} = require('../transformers/sku-image-transformer');
const { lockRow } = require('../utils/db/lock-modes');
const { withTransaction } = require('../database/db');
const {
  resolveSource,
  detectImageSource,
} = require('../utils/media/image-source');
const { processImageFile } = require('../utils/media/sku-image-media');

const CONTEXT = 'sku-image-service';
const BULK_SKU_CONCURRENCY = 3;

/**
 * Processes and uploads image variants for a single SKU.
 *
 * Normalizes image inputs, assigns display order and primary status, processes
 * each image concurrently up to the CPU-based concurrency limit, and returns
 * flat variant rows ready for DB insertion.
 *
 * Individual image failures are logged and skipped — they do not abort the batch.
 *
 * @param {Array<Object>} images               - Raw image input objects.
 * @param {string}        sku                  - SKU code for file naming and logging.
 * @param {boolean}       isProd               - Whether to use production storage.
 * @param {string}        bucketName           - Target S3 bucket name.
 * @param {Object}        options
 * @param {number}        options.baseDisplayOrder   - Starting display order offset.
 * @param {boolean}       options.alreadyHasPrimary  - Whether a primary image already exists.
 * @returns {Promise<Array<Object>>} Flat processed image variant rows.
 */
const processAndUploadSkuImages = async (
  images,
  sku,
  isProd,
  bucketName,
  { baseDisplayOrder, alreadyHasPrimary }
) => {
  const context = `${CONTEXT}/processAndUploadSkuImages`;

  if (!Array.isArray(images) || images.length === 0) return [];
  
  const normalizedImages = images
    .filter((img) =>
      Buffer.isBuffer(img?.file?.buffer) || img?.url || img?.image_url
    )
    .map((img, index) => ({
      file: Buffer.isBuffer(img?.file?.buffer) ? img.file : null,
      src: img.image_url ?? img.url ?? null,
      alt_text: img.alt_text || '',
      requestedType: img.image_type === 'main' ? 'main' : 'auto',
      index,
    }));

  if (!normalizedImages.length) return [];

  if (!normalizedImages.some((i) => i.requestedType === 'main')) {
    normalizedImages[0].requestedType = 'main';
  }

  const primaryIndex = alreadyHasPrimary
    ? -1
    : normalizedImages.findIndex((i) => i.requestedType === 'main');

  const concurrencyLimit = Math.min(os.cpus().length * 2, 8);

  const processSingleImage = async (img) => {
    try {
      const { file, src, alt_text, index } = img;
      
      // Direct upload uses the buffer in hand; URL goes through SSRF-guarded resolver
      const sourceFile = file ?? await resolveSource(src, sku);
      
      const { mainKey, thumbKey, zoomKey, mainSizeKb, thumbSizeKb, zoomSizeKb, ext } =
        await processImageFile(sourceFile, sku, isProd, bucketName);
      
      const groupId = crypto.randomUUID();
      const isPrimary = index === primaryIndex && primaryIndex !== -1;
      const baseOrder = index * 3;

      return [
        {
          group_id: groupId,
          image_url: mainKey,
          image_type: 'main',
          display_order: baseDisplayOrder + baseOrder,
          file_format: 'webp',
          file_size_kb: mainSizeKb,
          alt_text,
          is_primary: isPrimary,
        },
        {
          group_id: groupId,
          image_url: thumbKey,
          image_type: 'thumbnail',
          display_order: baseDisplayOrder + baseOrder + 1,
          file_format: 'webp',
          file_size_kb: thumbSizeKb,
          alt_text,
          is_primary: false,
        },
        {
          group_id: groupId,
          image_url: zoomKey,
          image_type: 'zoom',
          display_order: baseDisplayOrder + baseOrder + 2,
          file_format: ext,
          file_size_kb: zoomSizeKb,
          alt_text,
          is_primary: false,
        },
      ];
    } catch (error) {
      // Per-image fault tolerance — log and skip; do not abort the batch.
      logSystemException(error, 'Image processing failed', { context, sku });
      return null;
    }
  };

  const results = await processWithConcurrencyLimit(
    normalizedImages,
    concurrencyLimit,
    processSingleImage
  );
  const processed = [];

  for (const r of results) {
    if (Array.isArray(r)) processed.push(...r);
  }

  return processed;
};

/**
 * Reprocesses updated SKU image variants when a new source is provided.
 *
 * Uses an uploaded file buffer first, then falls back to a detected image URL/path.
 * When no new source is detected, URL and size fields are returned as `null`,
 * allowing the downstream update layer to preserve existing values when using
 * null-safe update logic such as COALESCE.
 *
 * Processing errors are re-thrown or wrapped as service errors so the caller can
 * preserve SKU-level atomicity, usually through a transaction.
 *
 * @param {Array<Object>} images     - Image update objects.
 * @param {string}        skuCode    - SKU code for processing and file naming.
 * @param {boolean}       isProd     - Whether to use production storage.
 * @param {string}        bucketName - Target S3 bucket name.
 * @returns {Promise<Array<Object>>} Normalized image update objects with processed variant URLs when available.
 */
const reprocessUpdatedSkuImages = async (images, skuCode, isProd, bucketName) => {
  const context = `${CONTEXT}/reprocessUpdatedSkuImages`;
  
  if (!Array.isArray(images) || images.length === 0) return images ?? [];
  
  const processed = [];
  
  for (const image of images) {
    try {
      let variantData = null;
      
      // Determine source: direct upload file, then fall back to detected URL/path
      const sourceFile = image?.file?.buffer && Buffer.isBuffer(image.file.buffer)
        ? image.file
        : (() => {
          const detected = detectImageSource(image);
          return detected ? null : null; // placeholder, see below
        })();
      
      const detectedSrc = !sourceFile ? detectImageSource(image) : null;
      const finalFile = sourceFile ?? (detectedSrc ? await resolveSource(detectedSrc, skuCode) : null);
      
      if (finalFile) {
        const { mainKey, thumbKey, zoomKey, mainSizeKb, thumbSizeKb, zoomSizeKb } =
          await processImageFile(finalFile, skuCode, isProd, bucketName);
        
        variantData = {
          main_url: mainKey,
          thumb_url: thumbKey,
          zoom_url: zoomKey,
          main_size_kb: mainSizeKb,
          thumb_size_kb: thumbSizeKb,
          zoom_size_kb: zoomSizeKb,
        };
      }
      
      processed.push({
        group_id: image.group_id,
        main_url:  variantData?.main_url  ?? null,
        thumb_url: variantData?.thumb_url ?? null,
        zoom_url:  variantData?.zoom_url  ?? null,
        main_size_kb:  variantData?.main_size_kb  ?? null,
        thumb_size_kb: variantData?.thumb_size_kb ?? null,
        zoom_size_kb:  variantData?.zoom_size_kb  ?? null,
        display_order: image.display_order ?? null,
        alt_text:      image.alt_text      ?? null,
        is_primary:    image.is_primary    ?? null,
      });
    } catch (error) {
      // No log here — re-throw lets global handler log once; SKU-level atomicity preserved.
      if (error instanceof AppError) throw error;
      throw AppError.serviceError('Image reprocessing failed', {
        cause: error,
        meta: { context, skuCode, groupId: image?.group_id },
      });
    }
  }
  
  return processed;
};

/**
 * Saves processed images for a single SKU within an existing transaction.
 *
 * Locks the SKU row, reads current image state, processes and uploads variants,
 * normalizes metadata, and inserts records in bulk.
 *
 * @param {Array<Object>}           images
 * @param {string}                  skuId
 * @param {string}                  skuCode
 * @param {Object}                  user
 * @param {boolean}                 isProd
 * @param {string}                  bucketName
 * @param {import('pg').PoolClient} client    - Required — must be called within a transaction.
 * @returns {Promise<Array<Object>>} Transformed grouped image results.
 *
 * @throws {AppError} `validationError` – missing client, skuId, or user.
 * @throws {AppError} `notFoundError`   – SKU not found.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const saveSkuImagesService = async (
  images,
  skuId,
  skuCode,
  user,
  isProd,
  bucketName,
  client = null
) => {
  const context = `${CONTEXT}/saveSkuImagesService`;
  const userId = user?.id;

  try {
    if (!client) throw AppError.validationError('Database client is required.');
    if (!skuId)
      throw AppError.validationError('Missing required skuId for image save.');
    if (!userId)
      throw AppError.validationError('Authenticated user is required.');

    if (!Array.isArray(images) || images.length === 0) return [];

    // 1. Lock SKU row to prevent concurrent image edits.
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });

    if (!sku) throw AppError.notFoundError(`SKU not found: ${skuId}`);

    const { id: verifiedSkuId, sku: verifiedSkuCode } = sku;

    // 2. Read current image state.
    const [baseDisplayOrder, alreadyHasPrimary] = await Promise.all([
      getSkuImageDisplayOrderBase(verifiedSkuId, client),
      hasPrimaryMainImage(verifiedSkuId, client),
    ]);

    // 3. Process and upload image variants.
    const processedImages = await processAndUploadSkuImages(
      images,
      verifiedSkuCode,
      isProd,
      bucketName,
      { baseDisplayOrder, alreadyHasPrimary }
    );

    if (!processedImages?.length) return [];

    // 4. Normalize into DB insert payload.
    const rows = processedImages.map((img, index) =>
      normalizeSkuImageForInsert(img, verifiedSkuId, userId, index)
    );

    // 5. Insert and transform results.
    const result = await insertSkuImagesBulk(
      verifiedSkuId,
      rows,
      userId,
      client
    );

    return transformGroupedSkuImages(result ?? []);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to save SKU images.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Saves images for multiple SKUs concurrently with individual transaction isolation.
 *
 * Uses `Promise.allSettled` — failure of one SKU does not abort others.
 * Per-SKU failures are logged and returned as error entries in the result array.
 *
 * @param {Array<{ skuId: string, skuCode: string, images: Array<Object> }>} skuImageSets
 * @param {Object} user
 * @returns {Promise<Array<Object>>} Per-SKU result objects with success/error status.
 *
 * @throws {AppError} Re-throws AppErrors from setup/teardown unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const saveBulkSkuImagesService = async (skuImageSets, user) => {
  const context = `${CONTEXT}/saveBulkSkuImagesService`;
  const isProd = process.env.NODE_ENV === 'production';
  const bucketName = process.env.AWS_S3_IMAGES_BUCKET;
  const limit = pLimit(BULK_SKU_CONCURRENCY);

  try {
    if (!Array.isArray(skuImageSets) || skuImageSets.length === 0) return [];

    const results = await Promise.allSettled(
      skuImageSets.map(({ skuId, skuCode, images }) =>
        limit(() =>
          withTransaction((client) =>
            saveSkuImagesService(
              images,
              skuId,
              skuCode,
              user,
              isProd,
              bucketName,
              client
            )
          )
        )
      )
    );

    return results.map((res, i) => {
      const { skuId, skuCode } = skuImageSets[i];

      if (res.status === 'fulfilled') {
        return {
          skuId,
          skuCode,
          success: true,
          count: res.value.length,
          images: res.value,
          error: null,
        };
      }

      // Per-SKU failure — log here because Promise.allSettled captures it as data.
      logSystemException(res.reason, 'Failed to save SKU images', {
        context,
        skuId,
      });

      return {
        skuId,
        success: false,
        count: 0,
        images: [],
        error: res.reason?.message || 'Unknown error',
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to complete bulk SKU image upload.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Updates images for a single SKU within an existing transaction.
 *
 * Locks the SKU row, validates image group ownership, reprocesses variants
 * if a new source is detected, and applies bulk updates.
 *
 * @param {Array<Object>}           images
 * @param {string}                  skuId
 * @param {string}                  skuCode
 * @param {Object}                  user
 * @param {boolean}                 isProd
 * @param {string}                  bucketName
 * @param {import('pg').PoolClient} client    - Required — must be called within a transaction.
 * @returns {Promise<Array<Object>>} Transformed grouped image results.
 *
 * @throws {AppError} `validationError` – missing client, skuId, user, or invalid group ownership.
 * @throws {AppError} `notFoundError`   – SKU not found.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateSkuImagesService = async (
  images,
  skuId,
  skuCode,
  user,
  isProd,
  bucketName,
  client = null
) => {
  const context = `${CONTEXT}/updateSkuImagesService`;
  const userId = user?.id;

  try {
    if (!client) throw AppError.validationError('Database client is required.');
    if (!skuId) throw AppError.validationError('Missing skuId for update.');
    if (!userId)
      throw AppError.validationError('Authenticated user is required.');

    if (!Array.isArray(images) || images.length === 0) return [];

    // 1. Lock SKU row to prevent concurrent image updates.
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context });

    if (!sku) throw AppError.notFoundError(`SKU not found: ${skuId}`);

    const { id: verifiedSkuId } = sku;

    // 2. Validate that all group IDs belong to this SKU.
    const groupIds = images.map((u) => u.group_id);
    const existingGroupIds = await getSkuImageGroupIdsBySku(
      verifiedSkuId,
      groupIds,
      client
    );

    if (existingGroupIds.length !== groupIds.length) {
      throw AppError.validationError(
        'One or more image groups do not belong to this SKU.'
      );
    }
    
    // 3. Reprocess image variants if a new source is detected.
    const processedUpdates = await reprocessUpdatedSkuImages(
      images,
      skuCode,
      isProd,
      bucketName
    );

    // 4. Apply bulk update and transform results.
    const result = await updateSkuImagesBulk(
      verifiedSkuId,
      processedUpdates,
      userId,
      client
    );

    return transformGroupedSkuImages(result ?? []);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to update SKU images.', {
      context,
      meta: { error: error.message },
    });
  }
};

/**
 * Updates images for multiple SKUs concurrently with individual transaction isolation.
 *
 * Uses `Promise.allSettled` — failure of one SKU does not abort others.
 * Per-SKU failures are logged and returned as error entries in the result array.
 *
 * @param {Array<{ skuId: string, skuCode: string, images: Array<Object> }>} skuUpdateSets
 * @param {Object} user
 * @returns {Promise<Array<Object>>} Per-SKU result objects with success/error status.
 *
 * @throws {AppError} Re-throws AppErrors from setup/teardown unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const updateBulkSkuImagesService = async (skuUpdateSets, user) => {
  const context = `${CONTEXT}/updateBulkSkuImagesService`;
  const isProd = process.env.NODE_ENV === 'production';
  const bucketName = process.env.AWS_S3_IMAGES_BUCKET;
  const limit = pLimit(BULK_SKU_CONCURRENCY);

  try {
    if (!Array.isArray(skuUpdateSets) || skuUpdateSets.length === 0) return [];

    const results = await Promise.allSettled(
      skuUpdateSets.map(({ skuId, skuCode, images }) =>
        limit(() =>
          withTransaction((client) =>
            updateSkuImagesService(
              images,
              skuId,
              skuCode,
              user,
              isProd,
              bucketName,
              client
            )
          )
        )
      )
    );

    return results.map((res, i) => {
      const { skuId, skuCode } = skuUpdateSets[i];

      if (res.status === 'fulfilled') {
        return {
          skuId,
          skuCode,
          success: true,
          count: res.value.length,
          images: res.value,
          error: null,
        };
      }

      // Per-SKU failure — log here because Promise.allSettled captures it as data.
      logSystemException(res.reason, 'Failed to update SKU images', {
        context,
        skuId,
      });

      return {
        skuId,
        success: false,
        count: 0,
        images: [],
        error: res.reason?.message || 'Unknown error',
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to complete bulk SKU image update.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  processAndUploadSkuImages,
  saveBulkSkuImagesService,
  updateBulkSkuImagesService,
};
