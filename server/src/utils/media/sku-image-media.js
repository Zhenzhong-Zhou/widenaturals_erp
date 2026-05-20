/**
 * @file sku-image-media.js
 * @module utils/sku-image-media
 * @description
 * Image processing pipeline for SKU image variants.
 *
 * Takes a source image buffer (typically from multer), generates resized WebP
 * variants in parallel via sharp, computes file sizes, and writes the results
 * to S3 (production) or the local public uploads directory (development).
 *
 * Variants:
 *   • main      → 1000px width, WebP (display)
 *   • thumbnail →  450px width, WebP (list/grid)
 *   • zoom      → original buffer, original format (full-resolution view)
 *
 * Object keys are content-addressed (`sku-images/<brand>/<hash>/...`) so
 * identical uploads deduplicate to the same path. The dev and prod key shapes
 * are identical; URL resolution at read time handles the routing.
 */

'use strict';

const sharp = require('sharp');
const path = require('path');
const fsp = require('fs/promises');
const crypto = require('crypto');
const AppError = require('../AppError');
const { uploadBufferToS3 } = require('../aws-s3-service');

const CONTEXT = 'sku-image-media';

/**
 * Resize/encode configuration per variant.
 *
 * - `width`   : target width in px; sharp auto-scales height to preserve aspect ratio.
 * - `quality` : libwebp quality (0–100). 80 is the sweet spot for product imagery.
 * - `effort`  : libwebp encode effort (0–6). Higher = smaller output, slower encode.
 *               Images are encoded once and served many times, so we lean high.
 */
const VARIANTS = {
  main:  { width: 1000, quality: 80, effort: 5 },
  thumb: { width: 450,  quality: 75, effort: 4 },
};

/**
 * Local fallback directory used only in development (when `isProd === false`).
 * Resolves to `<project-root>/public/uploads` so Express static middleware can
 * serve the files at the same relative paths used in S3 keys.
 */
const PUBLIC_UPLOADS_DIR = path.resolve(__dirname, '../../../public/uploads');

/**
 * Convert raw bytes to rounded kilobytes for response metadata.
 *
 * @param {number} bytes
 * @returns {number} Rounded kilobytes.
 */
const toKb = (bytes) => Math.round(bytes / 1024);

/**
 * Resize an image buffer to a target width and re-encode as WebP.
 *
 * Pure helper — no I/O, no logging, no side effects. Errors (invalid input
 * buffer, unsupported source format) bubble up to the caller for wrapping.
 *
 * @param {Buffer} sourceBuffer - Original image bytes.
 * @param {number} width - Output width in px; height auto-scales to preserve aspect ratio.
 * @param {number} [quality=80] - WebP quality, 0–100.
 * @param {number} [effort=5] - WebP encode effort, 0–6 (higher = smaller, slower).
 * @returns {Promise<Buffer>} WebP-encoded output buffer.
 */
const resizeImageToBuffer = async (sourceBuffer, width, quality = 80, effort = 5) =>
  sharp(sourceBuffer)
    .resize({ width })
    .webp({ quality, effort })
    .toBuffer();

/**
 * Short content hash used as the directory segment in the storage key.
 * SHA-256 truncated to 16 hex chars (64 bits) — ample for deduplication
 * inside a single SKU catalog; not used for any security purpose.
 *
 * @param {Buffer} buffer - Image bytes to fingerprint.
 * @returns {string} 16-character lowercase hex prefix.
 */
const getBufferHash = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);

/**
 * Write a buffer to the local public uploads directory under the given key.
 * Used only in development; in production the same key is written to S3.
 *
 * @param {string} key - Relative storage key (e.g. `sku-images/AB/<hash>/main.webp`).
 * @param {Buffer} buffer - File contents.
 * @returns {Promise<void>}
 */
const writeLocalUpload = async (key, buffer) => {
  const dest = path.join(PUBLIC_UPLOADS_DIR, key);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  await fsp.writeFile(dest, buffer);
};

/**
 * Process a single uploaded image into its three storage variants.
 *
 * Steps:
 *   1. Derive a brand folder from the first two chars of the SKU code.
 *   2. Hash the original buffer for a content-addressed path prefix.
 *   3. Resize main + thumb in parallel (zoom reuses the original buffer).
 *   4. Upload all three to S3 (prod) or write to the public uploads dir (dev).
 *
 * Idempotent by design: identical input buffers produce identical keys, so a
 * re-upload overwrites itself rather than creating duplicates.
 *
 * @param {ImageFile} file
 * @param {string} skuCode
 * @param {boolean} isProd
 * @param {string} bucketName
 * @returns {Promise<ProcessedImageResult>}
 * @throws {AppError} `fileSystemError` on any resize, hash, upload, or write failure.
 */
const processImageFile = async (
  { buffer, mimetype, originalname },
  skuCode,
  isProd,
  bucketName
) => {
  const context = `${CONTEXT}/processImageFile`;
  
  try {
    // Brand folder = first two chars of the SKU, uppercased. Groups uploads
    // by product family for human browsability in S3/disk listings.
    const brandFolder = skuCode.slice(0, 2).toUpperCase();
    const hash = getBufferHash(buffer);
    
    // Extension is taken from the original filename so the zoom variant keeps
    // its native format (JPEG, PNG, etc). Falls back to `bin` when missing.
    const ext = path.extname(originalname).replace('.', '').toLowerCase() || 'bin';
    
    // Resize variants in parallel — buffer in, buffer out, no temp files.
    const [mainBuffer, thumbBuffer] = await Promise.all([
      resizeImageToBuffer(buffer, VARIANTS.main.width,  VARIANTS.main.quality,  VARIANTS.main.effort),
      resizeImageToBuffer(buffer, VARIANTS.thumb.width, VARIANTS.thumb.quality, VARIANTS.thumb.effort),
    ]);
    
    const mainSizeKb  = toKb(mainBuffer.length);
    const thumbSizeKb = toKb(thumbBuffer.length);
    const zoomSizeKb  = toKb(buffer.length);
    
    // Identical key shape in dev and prod — read-time URL resolution handles
    // the dev vs S3 routing, so callers don't branch on environment.
    const keyPrefix = `sku-images/${brandFolder}/${hash}`;
    const mainKey   = `${keyPrefix}/main.webp`;
    const thumbKey  = `${keyPrefix}/thumb.webp`;
    const zoomKey   = `${keyPrefix}/zoom.${ext}`;
    
    if (isProd) {
      await Promise.all([
        uploadBufferToS3(bucketName, mainKey,  mainBuffer,  'image/webp'),
        uploadBufferToS3(bucketName, thumbKey, thumbBuffer, 'image/webp'),
        uploadBufferToS3(bucketName, zoomKey,  buffer,      mimetype),
      ]);
    } else {
      await Promise.all([
        writeLocalUpload(mainKey,  mainBuffer),
        writeLocalUpload(thumbKey, thumbBuffer),
        writeLocalUpload(zoomKey,  buffer),
      ]);
    }
    
    return {
      mainKey,
      thumbKey,
      zoomKey,
      mainSizeKb,
      thumbSizeKb,
      zoomSizeKb,
      ext,
    };
  } catch (error) {
    // AppError pass-through — never re-wrap an already-classified error.
    if (error instanceof AppError) throw error;
    throw AppError.fileSystemError('Failed to process image file', {
      cause: error,
      meta: { context, skuCode },
    });
  }
  // No `finally` cleanup — everything stays in memory until upload/write returns.
};

module.exports = {
  resizeImageToBuffer,
  processImageFile,
};
