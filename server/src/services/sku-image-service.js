const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const os = require('os');
const path = require('path');
const fs = require('fs/promises');
const pLimit = require('p-limit').default;
const { resizeImage } = require('../utils/image-utils');
const { s3ObjectExists, uploadSkuImageToS3 } = require('../utils/aws-s3-service');
const { insertSkuImagesBulk, assertNoExistingSkuImages } = require('../repositories/sku-image-repository');
const { processWithConcurrencyLimit } = require('../utils/concurrency-utils');
const { getFileHash } = require('../utils/file-hash-utils');
const AppError = require('../utils/AppError');
const { deduplicateSkuImages, normalizeSkuImageForInsert } = require('../business/sku-image-buiness');
const { transformSkuImageResults } = require('../transformers/sku-image-transformer');
const { lockRow, withTransaction } = require('../database/db');

/**
 * @async
 * @function
 * @description
 * Efficiently processes and uploads one or more SKU images by generating three
 * variants per input (main, thumbnail, zoom). Handles both local and remote URLs,
 * supports concurrency limits, uses file hashing for deduplication, and cleans up
 * temporary files automatically.
 *
 * Optimized for bulk SKU uploads:
 *  - Adaptive concurrency based on CPU cores (max 6)
 *  - Reuses existing S3 objects when already uploaded
 *  - Fault-tolerant (continues processing if one image fails)
 *  - Automatically deletes temp files when complete
 *
 * @param {Array<{url: string, alt_text?: string}>} images - Array of images to process.
 * @param {string} sku - SKU code (used for folder naming).
 * @param {boolean} isProd - Whether to use S3 or local dev storage.
 * @param {string} bucketName - S3 bucket name (used when isProd = true).
 * @returns {Promise<Array<Object>>} Array of processed image metadata variants.
 */
const processAndUploadSkuImages = async (images, sku, isProd, bucketName) => {
  const context = 'sku-image-service/processAndUploadSkuImages';
  const processed = [];
  const brandFolder = sku.slice(0, 2).toUpperCase();
  const tempDir = path.join('temp', sku);
  
  if (!Array.isArray(images) || images.length === 0) {
    logSystemInfo('No images passed to processAndUploadSkuImages', { context, sku });
    return [];
  }
  
  // Adaptive concurrency: (CPU count - 1), capped between 2 and 6
  const concurrencyLimit = Math.min(Math.max(os.cpus().length - 1, 2), 6);
  
  await fs.mkdir(tempDir, { recursive: true });
  
  /**
   * @private
   * Process a single image: fetch/download → cache check → resize → upload → metadata.
   */
  const processSingleImage = async (img) => {
    let localPath;
    try {
      logSystemInfo('Processing single image', { context, sku, img });
      
      const srcUrl = img.url || img.image_url;
      if (!srcUrl) {
        throw AppError.validationError('Missing image URL or local path');
      }
      
      // --- Step 1: Resolve local or remote source ---
      if (srcUrl.startsWith('http')) {
        const filename = path.basename(new URL(srcUrl).pathname);
        const tempFile = path.join(tempDir, filename);
        const response = await fetch(srcUrl);
        if (!response.ok) {
          throw AppError.fileSystemError(`Failed to fetch image: ${srcUrl}`, {
            status: response.status,
            statusText: response.statusText,
            retryable: response.status >= 500, // e.g. retry only on server errors
            traceId: `${sku}-${Date.now().toString(36)}`,
            context,
            sku,
          });
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(tempFile, buffer);
        localPath = tempFile;
        logSystemInfo('Downloaded remote image to temp dir', { context, imgUrl: srcUrl });
      } else {
        localPath = path.isAbsolute(srcUrl)
          ? srcUrl
          : path.resolve(__dirname, '../../', srcUrl);
      }
      
      await fs.access(localPath);
      
      // --- Step 2: Compute hash for folder grouping ---
      const hash = await getFileHash(localPath);
      
      // --- Step 3: Optional cache reuse (skip re-upload if already exists) ---
      if (isProd) {
        const keyPrefix = `sku-images/${brandFolder}/${hash}`;
        const baseName = path.basename(localPath, path.extname(localPath));
        const mainKey = `${keyPrefix}/${baseName}_main.webp`;
        const thumbKey = `${keyPrefix}/${baseName}_thumb.webp`;
        
        const [mainExists, thumbExists] = await Promise.all([
          s3ObjectExists(bucketName, mainKey),
          s3ObjectExists(bucketName, thumbKey),
        ]);
        
        if (mainExists && thumbExists) {
          logSystemInfo('Image already exists on S3, skipping resize/upload', {
            context,
            sku,
            mainKey,
            thumbKey,
          });
          
          return [
            {
              image_url: `https://${bucketName}.s3.amazonaws.com/${mainKey}`,
              image_type: 'main',
              display_order: 0,
              file_format: 'webp',
              alt_text: img.alt_text || '',
              is_primary: true,
            },
            {
              image_url: `https://${bucketName}.s3.amazonaws.com/${thumbKey}`,
              image_type: 'thumbnail',
              display_order: 1,
              file_format: 'webp',
              alt_text: img.alt_text || '',
              is_primary: false,
            },
          ];
        }
      }
      
      // --- Step 4: Resize main + thumbnail variants ---
      const baseName = path.basename(localPath, path.extname(localPath));
      const mainFileName = `${baseName}_main.webp`;
      const thumbFileName = `${baseName}_thumb.webp`;
      const resizedMainPath = path.join(tempDir, mainFileName);
      const resizedThumbPath = path.join(tempDir, thumbFileName);
      
      await Promise.all([
        resizeImage(localPath, resizedMainPath, 800, 70, 5),
        resizeImage(localPath, resizedThumbPath, 200, 60, 4),
      ]);
      
      // --- Step 5: Upload to S3 or local folder ---
      let mainUrl, thumbUrl, zoomUrl;
      if (isProd) {
        const keyPrefix = `sku-images/${brandFolder}/${hash}`;
        [mainUrl, thumbUrl, zoomUrl] = await Promise.all([
          uploadSkuImageToS3(bucketName, resizedMainPath, keyPrefix, mainFileName),
          uploadSkuImageToS3(bucketName, resizedThumbPath, keyPrefix, thumbFileName),
          uploadSkuImageToS3(bucketName, localPath, keyPrefix, path.basename(localPath)),
        ]);
      } else {
        const devDir = path.resolve(__dirname, '../../public/uploads/sku-images', brandFolder);
        await fs.mkdir(devDir, { recursive: true });
        await Promise.all([
          fs.copyFile(resizedMainPath, path.join(devDir, mainFileName)),
          fs.copyFile(resizedThumbPath, path.join(devDir, thumbFileName)),
          fs.copyFile(localPath, path.join(devDir, path.basename(localPath))),
        ]);
        
        const publicBase = `/uploads/sku-images/${brandFolder}/${baseName}`;
        mainUrl = `${publicBase}_main.webp`;
        thumbUrl = `${publicBase}_thumb.webp`;
        zoomUrl = `${publicBase}${path.extname(localPath)}`;
      }
      
      // --- Step 6: Collect metadata for DB insert ---
      const [mainStats, thumbStats, zoomStats] = await Promise.all([
        fs.stat(resizedMainPath),
        fs.stat(resizedThumbPath),
        fs.stat(localPath),
      ]);
      
      const ext = path.extname(localPath).replace('.', '') || 'webp';
      
      return [
        {
          image_url: mainUrl,
          image_type: 'main',
          display_order: 0,
          file_size_kb: Math.round(mainStats.size / 1024),
          file_format: 'webp',
          alt_text: img.alt_text || '',
          is_primary: true,
        },
        {
          image_url: thumbUrl,
          image_type: 'thumbnail',
          display_order: 1,
          file_size_kb: Math.round(thumbStats.size / 1024),
          file_format: 'webp',
          alt_text: img.alt_text || '',
          is_primary: false,
        },
        {
          image_url: zoomUrl,
          image_type: 'zoom',
          display_order: 2,
          file_size_kb: Math.round(zoomStats.size / 1024),
          file_format: ext,
          alt_text: img.alt_text || '',
          is_primary: false,
        },
      ];
    } catch (error) {
      logSystemException(error, 'Error processing single image', { context, sku, imgUrl: img.url });
      return null;
    }
  };
  
  // --- Step 7: Process all images concurrently with safe limits ---
  try {
    const results = await processWithConcurrencyLimit(images, concurrencyLimit, processSingleImage);
    
    for (const r of results) {
      if (Array.isArray(r)) processed.push(...r);
    }
    
    logSystemInfo('Completed processing SKU image batch', {
      context,
      sku,
      processedCount: processed.length,
      totalImages: images.length,
    });
  } catch (error) {
    logSystemException(error, 'Unhandled error during image batch processing', { context, sku });
    throw AppError.serviceError('Failed to process SKU images', { cause: error, sku });
  } finally {
    try {
      // Clean up per-SKU temp folder
      await fs.rm(tempDir, { recursive: true, force: true });
      
      // Optionally clean up isolated Multer subdir if it exists
      const multerTempDir = path.resolve(__dirname, `../../temp/uploads/${sku}`);
      if (await fs.stat(multerTempDir).catch(() => false)) {
        await fs.rm(multerTempDir, { recursive: true, force: true });
      }
      
      logSystemInfo('Temporary files cleaned up', { context, sku });
    } catch (cleanupError) {
      logSystemException(cleanupError, 'Failed during temporary file cleanup', { context, sku });
    }
  }
  
  return processed;
};

/**
 * @async
 * @function
 * @description
 * Handles the full end-to-end workflow for saving images associated with a SKU.
 *
 * The service:
 *   1. Validates and locks the SKU record within a transaction.
 *   2. Ensures no prior images exist (immutable policy).
 *   3. Processes and uploads image variants (main, thumbnail, zoom) via
 *      `processAndUploadSkuImages()`, supporting both local and S3 modes.
 *   4. Deduplicates processed variants by (sku_id, image_url).
 *   5. Normalizes metadata for bulk insertion using
 *      `normalizeSkuImageForInsert()`.
 *   6. Persists the records via `insertSkuImagesBulk()`.
 *   7. Returns normalized, API-ready image metadata via
 *      `transformSkuImageResults()`.
 *
 * @param {Array<Object>} images - Array of uploaded image descriptors ({ url, alt_text }).
 * @param {string} skuId - UUID of the target SKU.
 * @param {string} skuCode - SKU code (used for directory naming and trace logging).
 * @param {Object} user - Authenticated user performing the upload (expects `id` field).
 * @param {boolean} isProd - True when uploading to S3; false for local development.
 * @param {string} bucketName - S3 bucket name (only required if `isProd` = true).
 * @param {object|null} [client=null] - Optional PostgreSQL client for transactional use.
 * @returns {Promise<Array<Object>>} Array of inserted and transformed image records.
 * @throws {AppError} Various application-level errors (validation, not found, database, etc.).
 */
const saveSkuImagesService = async (images, skuId, skuCode, user, isProd, bucketName, client = null) => {
  const context = 'sku-image-service/saveSkuImagesService';
  const userId = user?.id;
  const startTime = Date.now();
  const traceId = `${skuCode}-${Date.now().toString(36)}`;
  
  try {
    // --- Step 0: Fast-fail validation ---
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
    
    // --- Step 1: Lock SKU row to ensure valid reference and prevent concurrent edits ---
    const sku = await lockRow(client, 'skus', skuId, 'FOR UPDATE', { context, traceId });
    if (!sku) {
      logSystemInfo('SKU not found during image save', { context, skuId, traceId });
      throw AppError.notFoundError(`SKU not found: ${skuId}`);
    }
    
    // --- Step 2: Enforce immutable policy (no existing images) ---
    await assertNoExistingSkuImages(sku.id, client);
    
    const { id: verifiedSkuId, sku: verifiedSkuCode } = sku;
    
    // --- Step 3: Process and upload all images ---
    // Generates main, thumbnail, and zoom variants for each input image.
    const processedImages = await processAndUploadSkuImages(images, verifiedSkuCode, isProd, bucketName);
    
    if (!processedImages?.length) {
      logSystemInfo('No images processed; skipping DB insert.', { context, verifiedSkuId, traceId });
      return [];
    }
    
    // --- Step 4: Deduplicate processed images by (sku_id, image_url) ---
    const uniqueProcessed = deduplicateSkuImages(processedImages, verifiedSkuId);
    if (uniqueProcessed.length < processedImages.length) {
      logSystemInfo('Deduplication removed duplicate images', {
        context,
        skuId: verifiedSkuId,
        removed: processedImages.length - uniqueProcessed.length,
        traceId,
      });
    }
    
    // --- Step 5: Normalize image metadata for DB insert ---
    const rows = uniqueProcessed.map((img, index) =>
      normalizeSkuImageForInsert(img, verifiedSkuId, userId, index)
    );
    
    // --- Step 6: Insert records into the database in bulk ---
    const result = await insertSkuImagesBulk(verifiedSkuId, rows, userId, client);
    
    const elapsedMs = Date.now() - startTime;
    logSystemInfo('Inserted SKU images successfully', {
      context,
      skuId,
      traceId,
      insertedCount: result.length,
      dedupedCount: rows.length,
      elapsedMs,
    });
    
    // --- Step 7: Transform and return API-friendly result ---
    return transformSkuImageResults(result ?? []);
  } catch (error) {
    logSystemException(error, 'Failed to save SKU images', { context, skuId, skuCode, traceId });
    
    // If it’s not an AppError (unexpected runtime error)
    if (!(error instanceof AppError)) {
      throw AppError.serviceError('Unexpected error during saveSkuImagesService', {
        cause: error,
        skuId,
        skuCode,
        traceId,
      });
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
const saveBulkSkuImagesService = async (skuImageSets, user, isProd, bucketName) => {
  const context = 'sku-image-service/saveBulkSkuImagesService';
  const startTime = Date.now();
  const limit = pLimit(3); // Safe concurrent transaction cap
  
  try {
    if (!Array.isArray(skuImageSets) || skuImageSets.length === 0) {
      logSystemInfo('No SKU image sets provided; nothing to process', { context });
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
            saveSkuImagesService(images, skuId, skuCode, user, isProd, bucketName, client)
          )
        )
      )
    );
    
    const normalized = results.map((res, i) => {
      const { skuId } = skuImageSets[i];
      if (res.status === 'fulfilled') {
        const data = res.value;
        logSystemInfo('SKU images saved successfully', { context, skuId, count: data.length });
        return { skuId, success: true, count: data.length, images: data, error: null };
      }
      
      logSystemException(res.reason, 'Failed to save SKU images', { context, skuId });
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
    logSystemException(error, 'Bulk SKU image batch failed unexpectedly', { context });
    // Only wrap unexpected runtime failures
    if (!(error instanceof AppError)) {
      throw AppError.serviceError('Failed to complete bulk SKU image upload batch.', {
        cause: error,
        context,
      });
    }
    throw error;
  }
};

module.exports = {
  processAndUploadSkuImages,
  saveSkuImagesService,
  saveBulkSkuImagesService,
};
