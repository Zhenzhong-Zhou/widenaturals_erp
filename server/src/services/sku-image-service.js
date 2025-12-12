const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const os = require('os');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const pLimit = require('p-limit').default;
const { resizeImage } = require('../utils/image-utils');
const {
  s3ObjectExists,
  uploadSkuImageToS3,
} = require('../utils/aws-s3-service');
const {
  getSkuImageDisplayOrderBase,
  hasPrimaryMainImage,
  insertSkuImagesBulk,
} = require('../repositories/sku-image-repository');
const { processWithConcurrencyLimit } = require('../utils/concurrency-utils');
const { getFileHashStream } = require('../utils/file-hash-utils');
const AppError = require('../utils/AppError');
const { normalizeSkuImageForInsert, } = require('../business/sku-image-buiness');
const { transformSkuImageResults, } = require('../transformers/sku-image-transformer');
const { lockRow, withTransaction, retry } = require('../database/db');

/**
 * @async
 * @function
 * @description
 * Processes and uploads one or more SKU images, generating three variants per input
 * image (main, thumbnail, zoom). Supports both local file paths and remote URLs,
 * applies bounded concurrency, and ensures deterministic ordering and primary
 * image selection.
 *
 * Key guarantees:
 *  - Deterministic ordering across batches using a shared group_id and display_order
 *  - At most one primary image per SKU (never overrides an existing primary)
 *  - Memory-safe streaming file hashing for deduplication
 *  - Reuses existing S3 objects when all variants already exist
 *  - Fault-tolerant: failures on individual images do not abort the batch
 *  - Automatic cleanup of temporary files on completion
 *
 * Storage behavior:
 *  - In production, uploads images to S3 under a hash-based directory
 *  - In non-production, writes images to the local public uploads directory
 *
 * @param {Array<{
 *   url?: string,
 *   image_url?: string,
 *   alt_text?: string,
 *   image_type?: 'main' | 'auto'
 * }>} images
 *   Array of image inputs to process. At least one image will be treated as `main`
 *   if none is explicitly specified.
 *
 * @param {string} sku
 *   SKU code used for brand folder derivation and file naming.
 *
 * @param {boolean} isProd
 *   Whether to upload images to S3 (`true`) or store them locally (`false`).
 *
 * @param {string} bucketName
 *   S3 bucket name used when `isProd` is `true`.
 *
 * @param {Object} options
 * @param {number} options.baseDisplayOrder
 *   Current maximum display_order for the SKU. New images will be appended after
 *   this value.
 *
 * @param {boolean} options.alreadyHasPrimary
 *   Indicates whether the SKU already has a primary image. When `true`, no new
 *   primary image will be assigned.
 *
 * @returns {Promise<Array<{
 *   image_url: string,
 *   image_type: 'main' | 'thumbnail' | 'zoom',
 *   display_order: number,
 *   file_format: string,
 *   alt_text: string,
 *   is_primary: boolean,
 *   group_id: string
 * }>>}
 *   Array of processed image metadata entries ready for bulk database insertion.
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
  const brandFolder = sku.slice(0, 2).toUpperCase();
  
  // Group ID guarantees ordering even with retries / batching
  const groupId = crypto.randomUUID();
  
  const tempDir = path.join(
    'temp',
    `${sku}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  
  if (!Array.isArray(images) || images.length === 0) {
    logSystemInfo('No images passed', { context, sku });
    return [];
  }
  
  const concurrencyLimit = Math.min(os.cpus().length * 2, 8);
  await fsp.mkdir(tempDir, { recursive: true });
  
  // ---------------------------------------------------------------------------
  // 1) Normalize input
  // ---------------------------------------------------------------------------
  const normalizedImages = images
    .filter(img => img?.url || img?.image_url)
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
  
  // Concurrency-safe primary determination
  const primaryIndex = alreadyHasPrimary
    ? -1
    : normalizedImages.findIndex(({ requestedType }) => requestedType === 'main');
  
  /**
   * Process one image
   */
  const processSingleImage = async (img) => {
    let localPath;
    
    try {
      const { src, alt_text, index } = img;
      if (!src) {
        throw AppError.validationError('Missing image source');
      }
      
      // ---------------------------------------------------------------------
      // Resolve source
      // ---------------------------------------------------------------------
      if (src.startsWith('http')) {
        const filename = path.basename(new URL(src).pathname);
        const tempFile = path.join(tempDir, filename);
        
        const response = await retry(() => fetch(src), 3);
        if (!response.ok || !response.body) {
          throw AppError.fileSystemError('Failed to fetch image', {
            status: response.status,
            retryable: response.status >= 500,
            context,
            sku,
          });
        }
        
        await new Promise((resolve, reject) => {
          const stream = fs.createWriteStream(tempFile);
          response.body.pipe(stream);
          stream.on('finish', resolve);
          stream.on('error', reject);
        });
        
        localPath = tempFile;
      } else {
        localPath = path.isAbsolute(src)
          ? src
          : path.resolve(__dirname, '../../', src);
      }
      
      await fsp.access(localPath);
      
      // ---------------------------------------------------------------------
      // Streaming hash (memory-safe)
      // ---------------------------------------------------------------------
      const hash = await getFileHashStream(localPath);
      const ext = path.extname(localPath).replace('.', '').toLowerCase();
      const baseName = path.basename(localPath, path.extname(localPath));
      
      const isPrimary = index === primaryIndex && primaryIndex !== -1;
      
      // display_order is absolute across SKU images; baseOrder ensures
      // this batch occupies a contiguous range without collisions
      const baseOrder = index * 3;
      
      // ---------------------------------------------------------------------
      // Cache reuse (prod only)
      // ---------------------------------------------------------------------
      if (isProd) {
        const keyPrefix = `sku-images/${brandFolder}/${hash}`;
        const mainKey = `${keyPrefix}/${baseName}_main.webp`;
        const thumbKey = `${keyPrefix}/${baseName}_thumb.webp`;
        const zoomKey = `${keyPrefix}/${path.basename(localPath)}`;
        
        const checks = await Promise.allSettled([
          s3ObjectExists(bucketName, mainKey),
          s3ObjectExists(bucketName, thumbKey),
          s3ObjectExists(bucketName, zoomKey),
        ]);
        
        const [mainCheck, thumbCheck, zoomCheck] = checks;
        
        if (
          mainCheck.status === 'fulfilled' && mainCheck.value &&
          thumbCheck.status === 'fulfilled' && thumbCheck.value &&
          zoomCheck.status === 'fulfilled' && zoomCheck.value
        ) {
          return [
            {
              group_id: groupId,
              image_url: `https://${bucketName}.s3.amazonaws.com/${mainKey}`,
              image_type: 'main',
              display_order: baseDisplayOrder + baseOrder,
              file_format: 'webp',
              alt_text,
              is_primary: isPrimary,
            },
            {
              group_id: groupId,
              image_url: `https://${bucketName}.s3.amazonaws.com/${thumbKey}`,
              image_type: 'thumbnail',
              display_order: baseDisplayOrder + baseOrder + 1,
              file_format: 'webp',
              alt_text,
              is_primary: false,
            },
            {
              group_id: groupId,
              image_url: `https://${bucketName}.s3.amazonaws.com/${zoomKey}`,
              image_type: 'zoom',
              display_order: baseDisplayOrder + baseOrder + 2,
              file_format: ext,
              alt_text,
              is_primary: false,
            },
          ];
        }
      }
      
      // ---------------------------------------------------------------------
      // Resize
      // ---------------------------------------------------------------------
      const resizedMain = path.join(tempDir, `${baseName}_main.webp`);
      const resizedThumb = path.join(tempDir, `${baseName}_thumb.webp`);
      
      await Promise.all([
        resizeImage(localPath, resizedMain, 800, 70, 5),
        resizeImage(localPath, resizedThumb, 200, 60, 4),
      ]);
      
      // ---------------------------------------------------------------------
      // Upload
      // ---------------------------------------------------------------------
      let mainUrl, thumbUrl, zoomUrl;
      const keyPrefix = `sku-images/${brandFolder}/${hash}`;
      
      if (isProd) {
        [mainUrl, thumbUrl, zoomUrl] = await Promise.all([
          uploadSkuImageToS3(bucketName, resizedMain, keyPrefix, `${baseName}_main.webp`),
          uploadSkuImageToS3(bucketName, resizedThumb, keyPrefix, `${baseName}_thumb.webp`),
          uploadSkuImageToS3(bucketName, localPath, keyPrefix, path.basename(localPath)),
        ]);
      } else {
        const devDir = path.resolve(
          __dirname,
          '../../public/uploads/sku-images',
          brandFolder
        );
        
        await fsp.mkdir(devDir, { recursive: true });
        await Promise.all([
          fsp.copyFile(resizedMain, path.join(devDir, `${baseName}_main.webp`)),
          fsp.copyFile(resizedThumb, path.join(devDir, `${baseName}_thumb.webp`)),
          fsp.copyFile(localPath, path.join(devDir, path.basename(localPath))),
        ]);
        
        const base = `/uploads/sku-images/${brandFolder}/${baseName}`;
        mainUrl = `${base}_main.webp`;
        thumbUrl = `${base}_thumb.webp`;
        zoomUrl = `${base}.${ext}`;
      }
      
      return [
        {
          group_id: groupId,
          image_url: mainUrl,
          image_type: 'main',
          display_order: baseDisplayOrder + baseOrder,
          file_format: 'webp',
          alt_text,
          is_primary: isPrimary,
        },
        {
          group_id: groupId,
          image_url: thumbUrl,
          image_type: 'thumbnail',
          display_order: baseDisplayOrder + baseOrder + 1,
          file_format: 'webp',
          alt_text,
          is_primary: false,
        },
        {
          group_id: groupId,
          image_url: zoomUrl,
          image_type: 'zoom',
          display_order: baseDisplayOrder + baseOrder + 2,
          file_format: ext,
          alt_text,
          is_primary: false,
        },
      ];
    } catch (error) {
      logSystemException(error, 'Image processing failed', { context, sku });
      return null;
    }
  };
  
  // ---------------------------------------------------------------------------
  // Execute
  // ---------------------------------------------------------------------------
  try {
    const results = await processWithConcurrencyLimit(
      normalizedImages,
      concurrencyLimit,
      processSingleImage
    );
    
    for (const r of results) {
      if (Array.isArray(r)) processed.push(...r);
    }
  } finally {
    await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
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
    return transformSkuImageResults(result ?? []);
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
  const limit = pLimit(3); // Safe concurrent transaction cap

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
      const { skuId } = skuImageSets[i];
      if (res.status === 'fulfilled') {
        const data = res.value;
        logSystemInfo('SKU images saved successfully', {
          context,
          skuId,
          count: data.length,
        });
        return {
          skuId,
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

module.exports = {
  processAndUploadSkuImages,
  saveSkuImagesService,
  saveBulkSkuImagesService,
};
