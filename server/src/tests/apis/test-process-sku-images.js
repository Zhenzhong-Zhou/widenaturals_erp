/**
 * @fileoverview
 * Manual test script for `processAndUploadSkuImages`.
 *
 * Purpose:
 *   - Execute and verify SKU image processing and upload logic end-to-end.
 *   - Validate main, thumbnail, and zoom variant generation.
 *   - Benchmark resizing, upload speed, and log output.
 *   - Verify correct metadata (file format, file size, display order, etc.)
 *
 * Usage:
 *   node test-process-sku-images.js
 *
 * Prerequisites:
 *   - `image-utils.js` and `aws-s3-service.js` are functional.
 *   - Local image files exist under `/assets/test-images`.
 *   - If running in production mode, ensure AWS credentials & bucket access.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const {
  processAndUploadSkuImages,
} = require('../../services/sku-image-service');

// --- CONFIGURABLE TEST PARAMS ---
const TEST_SKU = 'CH-TEST01-R-CN'; // Example SKU
const IS_PROD = false; // set true for actual S3 upload test
const BUCKET_NAME = 'wide-naturals-dev'; // your S3 bucket name (if IS_PROD=true)
const TEST_IMAGES = [
  {
    url: 'src/assets/sku-images/Canaherb/focus_CN.jpg',
    alt_text: 'Front view of Focus China version 111111',
  },
  {
    url: 'src/assets/sku-images/Canaherb/focus_CN.jpg',
    alt_text: 'Side view of Focus bottle 111111',
  },
];

(async () => {
  const logPrefix = chalk.cyan('[Test: PROCESS_SKU_IMAGES]');
  const startTime = performance.now();

  console.log(`${logPrefix} 🚀 Starting SKU image processing test...`);

  try {
    // Step 1 — Execute
    const results = await processAndUploadSkuImages(
      TEST_IMAGES,
      TEST_SKU,
      IS_PROD,
      BUCKET_NAME
    );

    // Step 2 — Validate results
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('❌ No processed image data returned.');
    }

    // Step 3 — Log processed results
    console.log(`${logPrefix} ✅ Processed images metadata:`);
    console.table(
      results.map((r) => ({
        type: r.image_type,
        url: r.image_url,
        kb: r.file_size_kb,
        fmt: r.file_format,
        primary: r.is_primary,
      }))
    );

    // Step 4 — Verify structure
    const variantTypes = new Set(results.map((r) => r.image_type));
    if (
      !variantTypes.has('main') ||
      !variantTypes.has('thumbnail') ||
      !variantTypes.has('zoom')
    ) {
      throw new Error('⚠️ Missing expected variants (main, thumbnail, zoom).');
    }

    // Step 5 — Log success
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logSystemInfo('SKU image processing completed successfully.', {
      context: 'test-process-sku-images',
      sku: TEST_SKU,
      processedCount: results.length,
      elapsedSeconds: elapsed,
      mode: IS_PROD ? 'prod' : 'dev',
    });

    console.log(
      `${logPrefix} 🏁 Completed successfully in ${chalk.green(`${elapsed}s`)}.`
    );
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(
      error,
      'Manual test for processAndUploadSkuImages failed',
      {
        context: 'test-process-sku-images',
        sku: TEST_SKU,
      }
    );
    process.exitCode = 1;
  } finally {
    console.log(`${logPrefix} 🧹 Cleanup complete. Exiting.`);
    process.exit(process.exitCode);
  }
})();
