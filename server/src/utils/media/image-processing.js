const sharp = require('sharp');
const path = require('path');
const fsp = require('fs/promises');
const { getFileHashStream } = require('../file-hash-utils');
const { uploadSkuImageToS3 } = require('../aws-s3-service');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Resize a local image to the given width and output to WebP format.
 *
 * Used by SKU image processing pipeline to generate optimized variants.
 *
 * @param {string} sourcePath - Path to original image
 * @param {string} targetPath - Output path for resized image
 * @param {number} width - Target width in pixels
 * @param {number} quality - Compression quality (1–100)
 * @param {number} effort - Compression effort (0–6)
 * @returns {Promise<void>}
 */
const resizeImage = async (
  sourcePath,
  targetPath,
  width,
  quality = 80,
  effort = 5
) => {
  await sharp(sourcePath)
    .resize({ width })
    .webp({ quality, effort })
    .toFile(targetPath);
};

/**
 * @async
 * @function
 *
 * @description
 * Processes a local image file and generates three SKU image variants:
 *
 *   • main       → 800px width, WebP format
 *   • thumbnail  → 200px width, WebP format
 *   • zoom       → original file (original format preserved)
 *
 * Responsibilities:
 *   • Generates content-based hash for deterministic storage path
 *   • Resizes main and thumbnail variants using Sharp
 *   • Calculates file size (in KB) for each variant
 *   • Uploads variants to S3 (production mode)
 *   • Copies variants to local public directory (development mode)
 *
 * File size policy:
 *   • mainSizeKb   → size of resized main.webp
 *   • thumbSizeKb  → size of resized thumb.webp
 *   • zoomSizeKb   → size of original file
 *
 * Storage behavior:
 *   • Production → S3 under: sku-images/{brand}/{hash}/
 *   • Development → /public/uploads/sku-images/{brand}/
 *
 * @param {string} localPath
 *   Absolute path to the source image file on disk.
 *
 * @param {string} skuCode
 *   SKU code used to derive brand folder namespace.
 *
 * @param {boolean} isProd
 *   Whether to upload images to S3 (true) or store locally (false).
 *
 * @param {string} bucketName
 *   Target S3 bucket name when isProd is true.
 *
 * @returns {Promise<{
 *   mainUrl: string,
 *   thumbUrl: string,
 *   zoomUrl: string,
 *   mainSizeKb: number,
 *   thumbSizeKb: number,
 *   zoomSizeKb: number,
 *   ext: string
 * }>}
 *
 * @throws {AppError}
 *   FileSystemError when resizing, hashing, upload, or IO operations fail.
 */
const processImageFile = async (localPath, skuCode, isProd, bucketName) => {
  const context = 'sku-image-media/processImageFile';

  try {
    const brandFolder = skuCode.slice(0, 2).toUpperCase();

    const hash = await getFileHashStream(localPath);
    const ext = path.extname(localPath).replace('.', '').toLowerCase();
    const baseName = path.basename(localPath, path.extname(localPath));

    const resizedMain = `${localPath}_main.webp`;
    const resizedThumb = `${localPath}_thumb.webp`;

    // Resize variants in parallel
    await Promise.all([
      resizeImage(localPath, resizedMain, 1000, 80, 5),
      resizeImage(localPath, resizedThumb, 450, 75, 4),
    ]);

    // -------------------------------
    // Get file sizes (bytes → KB)
    // -------------------------------
    const [mainStats, thumbStats, zoomStats] = await Promise.all([
      fsp.stat(resizedMain),
      fsp.stat(resizedThumb),
      fsp.stat(localPath),
    ]);

    const mainSizeKb = Math.round(mainStats.size / 1024);
    const thumbSizeKb = Math.round(thumbStats.size / 1024);
    const zoomSizeKb = Math.round(zoomStats.size / 1024);

    const keyPrefix = `sku-images/${brandFolder}/${hash}`;

    let mainUrl, thumbUrl, zoomUrl;

    if (isProd) {
      [mainUrl, thumbUrl, zoomUrl] = await Promise.all([
        uploadSkuImageToS3(
          bucketName,
          resizedMain,
          keyPrefix,
          `${baseName}_main.webp`
        ),
        uploadSkuImageToS3(
          bucketName,
          resizedThumb,
          keyPrefix,
          `${baseName}_thumb.webp`
        ),
        uploadSkuImageToS3(
          bucketName,
          localPath,
          keyPrefix,
          path.basename(localPath)
        ),
      ]);
    } else {
      const devDir = path.resolve(
        __dirname,
        '../../../public/uploads/sku-images',
        brandFolder
      );

      await fsp.mkdir(devDir, { recursive: true });

      const zoomFileName = path.basename(localPath);

      await Promise.all([
        fsp.copyFile(resizedMain, path.join(devDir, `${baseName}_main.webp`)),
        fsp.copyFile(resizedThumb, path.join(devDir, `${baseName}_thumb.webp`)),
        fsp.copyFile(localPath, path.join(devDir, zoomFileName)),
      ]);

      const base = `/uploads/sku-images/${brandFolder}/${baseName}`;

      mainUrl = `${base}_main.webp`;
      thumbUrl = `${base}_thumb.webp`;
      zoomUrl = `/uploads/sku-images/${brandFolder}/${zoomFileName}`;
    }

    return {
      mainUrl,
      thumbUrl,
      zoomUrl,
      mainSizeKb,
      thumbSizeKb,
      zoomSizeKb,
      ext,
    };
  } catch (error) {
    logSystemException(error, 'Image processing failed', {
      context,
      skuCode,
      localPath,
    });

    throw AppError.fileSystemError('Failed to process image file', {
      cause: error,
    });
  }
};

module.exports = {
  resizeImage,
  processImageFile,
};
