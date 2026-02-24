const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const os = require('os');
const pLimit = require('p-limit').default;
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
const { lockRow, withTransaction } = require('../database/db');
const { resolveSource, detectImageSource } = require('../utils/media/image-source');
const { processImageFile } = require('../utils/media/image-processing');

const BULK_SKU_CONCURRENCY = 3;

/**
 * @async
 * @function
 *
 * @description
 * Processes and uploads one or more SKU images, generating three variants
 * per input image:
 *
 *   • main       → 800px WebP
 *   • thumbnail  → 200px WebP
 *   • zoom       → original format
 *
 * Responsibilities:
 *   • Normalizes incoming image payloads
 *   • Determines primary image assignment
 *   • Applies bounded concurrency for processing
 *   • Delegates IO to resolveSource() and processImageFile()
 *   • Ensures deterministic ordering via group_id and display_order
 *   • Calculates file size per variant (KB)
 *
 * Primary rules:
 *   • If no image is explicitly marked as 'main', the first image becomes main
 *   • If the SKU already has a primary image, no new primary is assigned
 *   • At most one image per batch will be marked as primary
 *
 * Storage behavior:
 *   • Production → Uploads to S3
 *   • Development → Stores in local public uploads directory
 *
 * Concurrency:
 *   • Processing is executed with a bounded concurrency limit
 *   • Failures in individual images do not abort the entire batch
 *
 * @param {Array<{
 *   url?: string,
 *   image_url?: string,
 *   alt_text?: string,
 *   image_type?: 'main' | 'auto'
 * }>} images
 *
 * @param {string} sku
 * @param {boolean} isProd
 * @param {string} bucketName
 * @param {{ baseDisplayOrder: number, alreadyHasPrimary: boolean }} options
 *
 * @returns {Promise<Array<{
 *   group_id: string,
 *   image_url: string,
 *   image_type: 'main' | 'thumbnail' | 'zoom',
 *   display_order: number,
 *   file_format: string,
 *   file_size_kb: number,
 *   alt_text: string,
 *   is_primary: boolean
 * }>>}
 *
 * @throws {AppError}
 *   ValidationError for malformed input
 *   FileSystemError for processing or upload failures
 */
const processAndUploadSkuImages = async (
  images,
  sku,
  isProd,
  bucketName,
  { baseDisplayOrder, alreadyHasPrimary }
) => {
  const context = 'sku-image-service/processAndUploadSkuImages';
  const processed = [];
  
  if (!Array.isArray(images) || images.length === 0) {
    logSystemInfo('No images passed', { context, sku });
    return [];
  }
  
  const normalizedImages = images
    .filter((img) => img?.url || img?.image_url)
    .map((img, index) => ({
      src: img.image_url ?? img.url ?? null,
      alt_text: img.alt_text || '',
      requestedType: img.image_type === 'main' ? 'main' : 'auto',
      index,
    }));
  
  if (!normalizedImages.length) {
    logSystemInfo('All images missing URLs', { context, sku });
    return [];
  }
  
  if (!normalizedImages.some(i => i.requestedType === 'main')) {
    normalizedImages[0].requestedType = 'main';
  }
  
  const primaryIndex = alreadyHasPrimary
    ? -1
    : normalizedImages.findIndex(i => i.requestedType === 'main');
  
  const concurrencyLimit = Math.min(os.cpus().length * 2, 8);
  
  const processSingleImage = async (img) => {

    try {
      const { src, alt_text, index } = img;
      
      if (!src) {
        throw AppError.validationError('Missing image source');
      }

      const localPath = await resolveSource(src, sku);
      
      const {
        mainUrl,
        thumbUrl,
        zoomUrl,
        mainSizeKb,
        thumbSizeKb,
        zoomSizeKb,
        ext
      } = await processImageFile(localPath, sku, isProd, bucketName);
      
      const groupId = crypto.randomUUID();
      const isPrimary = index === primaryIndex && primaryIndex !== -1;
      const baseOrder = index * 3;
      
      return [
        {
          group_id: groupId,
          image_url: mainUrl,
          image_type: 'main',
          display_order: baseDisplayOrder + baseOrder,
          file_format: 'webp',
          file_size_kb: mainSizeKb,
          alt_text,
          is_primary: isPrimary,
        },
        {
          group_id: groupId,
          image_url: thumbUrl,
          image_type: 'thumbnail',
          display_order: baseDisplayOrder + baseOrder + 1,
          file_format: 'webp',
          file_size_kb: thumbSizeKb,
          alt_text,
          is_primary: false,
        },
        {
          group_id: groupId,
          image_url: zoomUrl,
          image_type: 'zoom',
          display_order: baseDisplayOrder + baseOrder + 2,
          file_format: ext,
          file_size_kb: zoomSizeKb,
          alt_text,
          is_primary: false,
        },
      ];
    } catch (error) {
      logSystemException(error, 'Image processing failed', { context, sku });
      return null;
    }
  };
  
  const results = await processWithConcurrencyLimit(
    normalizedImages,
    concurrencyLimit,
    processSingleImage
  );
  
  for (const r of results) {
    if (Array.isArray(r)) processed.push(...r);
  }
  
  return processed;
};

/**
 * @async
 * @function
 * @description
 * Handles the end-to-end workflow for saving images associated with a SKU.
 *
 * This service orchestrates validation, locking, image processing, and
 * persistence while delegating storage and transformation concerns to
 * specialized helpers.
 *
 * Workflow overview:
 *   1. Validates input and acquires a row-level lock on the SKU to prevent
 *      concurrent image modifications.
 *   2. Reads the current image state for the SKU, including the maximum
 *      display_order (append base) and whether a primary image already exists.
 *   3. Processes and uploads image variants (main, thumbnail, zoom) via
 *      `processAndUploadSkuImages()`, supporting both S3 (production) and
 *      local filesystem (development) storage.
 *   4. Normalizes processed image metadata for database insertion.
 *   5. Inserts or updates image records in bulk using `insertSkuImagesBulk()`,
 *      relying on database-level conflict handling for idempotency.
 *   6. Transforms persisted records into API-ready response objects.
 *
 * Key guarantees:
 *   - Deterministic ordering of images via display_order and group_id
 *   - At most one primary image per SKU (existing primary is never overridden)
 *   - Safe retries and idempotent behavior through DB constraints
 *   - Transactional consistency via row-level locking
 *
 * @param {Array<Object>} images
 *   Array of image descriptors to upload (e.g. `{ url, alt_text, image_type }`).
 *
 * @param {string} skuId
 *   UUID of the target SKU.
 *
 * @param {string} skuCode
 *   Human-readable SKU code used for directory naming and trace logging.
 *
 * @param {Object} user
 *   Authenticated user performing the upload (expects an `id` field).
 *
 * @param {boolean} isProd
 *   When true, images are uploaded to S3; when false, images are stored locally.
 *
 * @param {string} bucketName
 *   S3 bucket name (required when `isProd` is true).
 *
 * @param {object|null} [client=null]
 *   PostgreSQL client used for transactional operations. Must be provided when
 *   transactional guarantees are required.
 *
 * @returns {Promise<Array<Object>>}
 *   Array of inserted or updated image records, transformed into API-friendly
 *   response objects.
 *
 * @throws {AppError}
 *   Throws validation, not-found, database, or service errors when the workflow
 *   cannot be completed successfully.
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
  const context = 'sku-image-service/saveSkuImagesService';
  const userId = user?.id;
  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  try {
    // --- Step 0: Fast-fail validation ---
    if (!client) {
      throw AppError.validationError('Database client is required.');
    }
    if (!skuId) {
      throw AppError.validationError('Missing required skuId for image save.');
    }
    if (!Array.isArray(images) || images.length === 0) {
      logSystemInfo('No images provided; skipping save.', { context, skuId });
      return [];
    }

    logSystemInfo('Starting SKU image save workflow', {
      context,
      skuId,
      skuCode,
      imageCount: images.length,
      mode: isProd ? 'production' : 'development',
      traceId,
    });

    // --- Step 1: Lock SKU row to prevent concurrent image edits for the same SKU ---
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
      context,
      traceId,
    });
    if (!sku) {
      logSystemInfo('SKU not found during image save', {
        context,
        skuId,
        traceId,
      });
      throw AppError.notFoundError(`SKU not found: ${skuId}`);
    }

    const { id: verifiedSkuId, sku: verifiedSkuCode } = sku;

    // --- Step 2: Read current image state (append base + primary presence) ---
    const [baseDisplayOrder, alreadyHasPrimary] = await Promise.all([
      getSkuImageDisplayOrderBase(verifiedSkuId, client),
      hasPrimaryMainImage(verifiedSkuId, client),
    ]);

    // --- Step 3: Process and upload images (build variants + assign ordering metadata) ---
    const processedImages = await processAndUploadSkuImages(
      images,
      verifiedSkuCode,
      isProd,
      bucketName,
      { baseDisplayOrder, alreadyHasPrimary }
    );

    if (!processedImages?.length) {
      logSystemInfo('No images processed; skipping DB insert.', {
        context,
        verifiedSkuId,
        traceId,
      });
      return [];
    }

    // --- Step 4: Normalize processed metadata into DB insert payload ---
    const rows = processedImages.map((img, index) =>
      normalizeSkuImageForInsert(img, verifiedSkuId, userId, index)
    );

    // --- Step 5: Insert/update DB rows (canonical: ORDER BY group_id, display_order) ---
    const result = await insertSkuImagesBulk(
      verifiedSkuId,
      rows,
      userId,
      client
    );

    const elapsedMs = Date.now() - startTime;
    logSystemInfo('Inserted SKU images successfully', {
      context,
      skuId: verifiedSkuId,
      traceId,
      insertedCount: result.length,
      processedCount: rows.length,
      elapsedMs,
    });

    // --- Step 6: Transform and return API-friendly response ---
    return transformGroupedSkuImages(result ?? []);
  } catch (error) {
    logSystemException(error, 'Failed to save SKU images', {
      context,
      skuId,
      skuCode,
      traceId,
    });

    // If it’s not an AppError (unexpected runtime error)
    if (!(error instanceof AppError)) {
      throw AppError.serviceError(
        'Unexpected error during saveSkuImagesService',
        {
          cause: error,
          skuId,
          skuCode,
          traceId,
        }
      );
    }

    // Otherwise, rethrow existing AppError as-is
    throw error;
  }
};

/**
 * @async
 * @function
 * @description
 * High-level service that performs bulk SKU image uploads across multiple SKUs
 * in controlled parallel transactions. Each SKU’s images are handled independently
 * via `saveSkuImagesService`, ensuring transactional isolation and fault tolerance.
 *
 * ### Workflow
 * 1. Validates the batch input and logs the batch start.
 * 2. Runs each SKU’s upload inside a transaction using a concurrency cap (`pLimit`).
 * 3. Captures both success and failure results using `Promise.allSettled`.
 * 4. Returns a normalized summary array for all SKUs, preserving partial success.
 *
 * ### Key Features
 * - **Concurrent-safe:** Limits active uploads (default max = 3) to avoid DB contention.
 * - **Fault-tolerant:** A single SKU failure doesn’t abort the entire batch.
 * - **Structured Logging:** Logs timing, per-SKU results, and total batch duration.
 * - **Transaction-aware:** Each SKU upload executes within its own DB transaction.
 *
 * @param {Array<{ skuId: string, skuCode: string, images: Object[] }>} skuImageSets
 *   Array of SKU upload definitions, each containing a target SKU and its image set.
 * @param {Object} user
 *   Authenticated user context performing the upload (expects `id` field).
 * @param {boolean} isProd
 *   If `true`, images are uploaded to S3; otherwise, stored locally in dev mode.
 * @param {string} bucketName
 *   Target S3 bucket name (used only if `isProd` is true).
 * @returns {Promise<Array<{
 *   skuId: string,
 *   success: boolean,
 *   count: number,
 *   images: Object[],
 *   error: string|null
 * }>>}
 *   Normalized results per SKU, indicating whether each upload succeeded or failed.
 *
 * @throws {AppError} Only for unexpected global runtime or configuration failures.
 */
const saveBulkSkuImagesService = async (
  skuImageSets,
  user,
  isProd,
  bucketName
) => {
  const context = 'sku-image-service/saveBulkSkuImagesService';
  const startTime = Date.now();
  const limit = pLimit(BULK_SKU_CONCURRENCY); // Safe concurrent transaction cap

  try {
    if (!Array.isArray(skuImageSets) || skuImageSets.length === 0) {
      logSystemInfo('No SKU image sets provided; nothing to process', {
        context,
      });
      return [];
    }

    logSystemInfo('Starting bulk SKU image save batch', {
      context,
      skuCount: skuImageSets.length,
    });

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

    const normalized = results.map((res, i) => {
      const { skuId, skuCode } = skuImageSets[i];
      if (res.status === 'fulfilled') {
        const data = res.value;
        logSystemInfo('SKU images saved successfully', {
          context,
          skuId,
          count: data.length,
        });
        return {
          skuId,
          skuCode,
          success: true,
          count: data.length,
          images: data,
          error: null,
        };
      }

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

    const totalElapsed = Date.now() - startTime;
    logSystemInfo('Completed bulk SKU image upload batch', {
      context,
      skuCount: skuImageSets.length,
      totalElapsedMs: totalElapsed,
    });

    return normalized;
  } catch (error) {
    logSystemException(error, 'Bulk SKU image batch failed unexpectedly', {
      context,
    });
    // Only wrap unexpected runtime failures
    if (!(error instanceof AppError)) {
      throw AppError.serviceError(
        'Failed to complete bulk SKU image upload batch.',
        {
          cause: error,
          context,
        }
      );
    }
    throw error;
  }
};

/**
 * @async
 * @function
 *
 * @description
 * Reprocesses SKU images when a new source is provided.
 *
 * For each image:
 *   • Detects whether a new source requires reprocessing
 *   • Resolves source path (remote or local)
 *   • Generates image variants (main, thumbnail, zoom)
 *   • Captures file sizes per variant
 *   • Normalizes output for bulk repository update
 *
 * This function:
 *   • Does NOT perform database operations
 *   • Delegates IO and transformation to media utilities
 *   • Preserves atomic behavior (throws on failure)
 *
 * @param {Array<Object>} images
 * @param {string} skuCode
 * @param {boolean} isProd
 * @param {string} bucketName
 *
 * @returns {Promise<Array<Object>>}
 */
const reprocessUpdatedSkuImages = async (
  images,
  skuCode,
  isProd,
  bucketName
) => {
  const context = 'sku-image-service/reprocessUpdatedSkuImages';
  
  if (!Array.isArray(images) || images.length === 0) {
    return images ?? [];
  }
  
  const processed = [];
  
  for (const image of images) {
    try {
      let variantData = null;
      
      const sourcePath = detectImageSource(image);
      
      // Only reprocess if a new source is detected
      if (sourcePath) {
        const localPath = await resolveSource(sourcePath, skuCode);
        
        const {
          mainUrl,
          thumbUrl,
          zoomUrl,
          mainSizeKb,
          thumbSizeKb,
          zoomSizeKb
        } = await processImageFile(localPath, skuCode, isProd, bucketName);
        
        variantData = {
          main_url: mainUrl,
          thumb_url: thumbUrl,
          zoom_url: zoomUrl,
          main_size_kb: mainSizeKb,
          thumb_size_kb: thumbSizeKb,
          zoom_size_kb: zoomSizeKb
        };
      }
      
      processed.push({
        group_id: image.group_id,
        
        // URLs
        main_url: variantData?.main_url ?? null,
        thumb_url: variantData?.thumb_url ?? null,
        zoom_url: variantData?.zoom_url ?? null,
        
        // File sizes
        main_size_kb: variantData?.main_size_kb ?? null,
        thumb_size_kb: variantData?.thumb_size_kb ?? null,
        zoom_size_kb: variantData?.zoom_size_kb ?? null,
        
        // Metadata
        display_order: image.display_order ?? null,
        alt_text: image.alt_text ?? null,
        is_primary: image.is_primary ?? null,
      });
    } catch (error) {
      logSystemException(error, 'Image reprocessing failed', {
        context,
        skuCode,
        groupId: image?.group_id,
      });
      
      // Maintain SKU-level atomicity
      throw error;
    }
  }
  
  return processed;
};

/**
 * @async
 * @function
 *
 * @description
 * Executes the complete SKU image update workflow within a transaction.
 *
 * Workflow:
 *   1. Validates input and authenticated user
 *   2. Locks the SKU row (FOR UPDATE) to prevent concurrent conflicts
 *   3. Verifies image group ownership integrity
 *   4. Reprocesses images if new sources are provided
 *   5. Performs bulk group-based image update
 *   6. Returns transformed result set
 *
 * Concurrency:
 *   • Requires an active transaction-bound client
 *   • Ensures row-level locking on SKU
 *   • Maintains atomicity at SKU level
 *
 * Security:
 *   • Validates image ownership before update
 *   • Delegates SSRF protection to resolveSource()
 *
 * @param {Array<Object>} images
 * @param {string} skuId
 * @param {string} skuCode
 * @param {Object} user
 * @param {boolean} isProd
 * @param {string} bucketName
 * @param {Object} client - transaction-bound PostgreSQL client
 *
 * @returns {Promise<Array<Object>>}
 *
 * @throws {AppError}
 *   ValidationError for invalid input
 *   NotFoundError if SKU does not exist
 *   ServiceError for unexpected system failures
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
  const context = 'sku-image-service/updateSkuImagesService';
  const userId = user?.id;
  const traceId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // ------------------------------------------------------------
    // Step 0: Validation
    // ------------------------------------------------------------
    if (!client) {
      throw AppError.validationError('Database client is required.');
    }
    
    if (!skuId) {
      throw AppError.validationError('Missing skuId for update.');
    }
    
    // Ensure authenticated user context
    if (!userId) {
      throw AppError.validationError('Authenticated user is required.');
    }
    
    if (!Array.isArray(images) || images.length === 0) {
      logSystemInfo('No image updates provided; skipping.', {
        context,
        skuId,
        traceId,
      });
      return [];
    }
    
    logSystemInfo('Starting SKU image update workflow', {
      context,
      skuId,
      skuCode,
      updateCount: images.length,
      traceId,
    });
    
    // ------------------------------------------------------------
    // Step 1: Lock SKU row
    // ------------------------------------------------------------
    // Lock SKU row to prevent concurrent image updates
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', {
      context,
      traceId,
    });
    
    if (!sku) {
      throw AppError.notFoundError(`SKU not found: ${skuId}`);
    }
    
    const { id: verifiedSkuId } = sku;
    
    // ------------------------------------------------------------
    // Step 2: Validate ownership
    // ------------------------------------------------------------
    const groupIds = images.map(u => u.group_id);
    
    const existingGroupIds = await getSkuImageGroupIdsBySku(
      verifiedSkuId,
      groupIds,
      client
    );
    
    if (existingGroupIds.length !== groupIds.length) {
      throw AppError.validationError(
        'One or more image groups do not belong to this SKU'
      );
    }
    
    // ------------------------------------------------------------
    // Step 3: File reprocessing if needed
    // ------------------------------------------------------------
    const processedUpdates = await reprocessUpdatedSkuImages(
      images,
      skuCode,
      isProd,
      bucketName
    );

    // Step 4: Bulk update (group-based)
    const result = await updateSkuImagesBulk(
      verifiedSkuId,
      processedUpdates,
      userId,
      client
    );
    
    const elapsedMs = Date.now() - startTime;
    
    logSystemInfo('SKU image update completed', {
      context,
      skuId: verifiedSkuId,
      updatedCount: result.length,
      traceId,
      elapsedMs,
    });
    
    return transformGroupedSkuImages(result ?? []);
  } catch (error) {
    logSystemException(error, 'Failed to update SKU images', {
      context,
      skuId,
      skuCode,
      traceId,
    });
    
    if (!(error instanceof AppError)) {
      throw AppError.serviceError(
        'Unexpected error during updateSkuImagesService',
        {
          cause: error,
          skuId,
          skuCode,
          traceId,
        }
      );
    }
    
    throw error;
  }
};

/**
 * @async
 * @function
 *
 * @description
 * Processes bulk SKU image update operations with controlled concurrency.
 *
 * Each SKU update:
 *   • Executes within its own database transaction
 *   • Is isolated from other SKUs
 *   • Allows partial success across the batch
 *
 * Concurrency:
 *   • Uses p-limit to prevent database saturation
 *   • Default concurrency limit = 3 SKUs at a time
 *
 * Failure handling:
 *   • Individual SKU failures are captured and returned
 *   • Batch does NOT abort if one SKU fails
 *   • Unexpected system-level errors bubble up
 *
 * @param {Array<{
 *   skuId: string,
 *   skuCode: string,
 *   images: Array<Object>
 * }>} skuUpdateSets
 *
 * @param {Object} user
 * @param {boolean} isProd
 * @param {string} bucketName
 *
 * @returns {Promise<Array<{
 *   skuId: string,
 *   success: boolean,
 *   count: number,
 *   images: Array<Object>,
 *   error: string|null
 * }>>}
 *
 * @throws {AppError}
 *   Throws only for unexpected system-level failures.
 */
const updateBulkSkuImagesService = async (
  skuUpdateSets,
  user,
  isProd,
  bucketName
) => {
  const context = 'sku-image-service/updateBulkSkuImagesService';
  const startTime = Date.now();
  const limit = pLimit(BULK_SKU_CONCURRENCY); // Prevent DB overload
  
  try {
    if (!Array.isArray(skuUpdateSets) || skuUpdateSets.length === 0) {
      logSystemInfo('No SKU update sets provided; nothing to process', {
        context,
      });
      return [];
    }
    
    logSystemInfo('Starting bulk SKU image update batch', {
      context,
      skuCount: skuUpdateSets.length,
    });
    
    // Each SKU update runs in its own transaction.
    // Failure of one SKU does NOT rollback others.
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
    
    const normalized = results.map((res, i) => {
      const { skuId, skuCode } = skuUpdateSets[i];
      
      if (res.status === 'fulfilled') {
        const data = res.value;
        
        logSystemInfo('SKU images updated successfully', {
          context,
          skuId,
          count: data.length,
        });
        
        return {
          skuId,
          skuCode,
          success: true,
          count: data.length,
          images: data,
          error: null,
        };
      }
      
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
    
    const totalElapsed = Date.now() - startTime;
    
    logSystemInfo('Completed bulk SKU image update batch', {
      context,
      skuCount: skuUpdateSets.length,
      totalElapsedMs: totalElapsed,
    });
    
    return normalized;
  } catch (error) {
    logSystemException(
      error,
      'Bulk SKU image update batch failed unexpectedly',
      { context }
    );
    
    if (!(error instanceof AppError)) {
      throw AppError.serviceError(
        'Failed to complete bulk SKU image update batch.',
        {
          cause: error,
          context,
        }
      );
    }
    
    throw error;
  }
};

module.exports = {
  processAndUploadSkuImages,
  saveBulkSkuImagesService,
  updateBulkSkuImagesService,
};
