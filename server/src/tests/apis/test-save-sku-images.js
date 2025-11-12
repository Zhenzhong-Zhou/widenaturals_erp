/**
 * @fileoverview
 * Manual test script for `saveSkuImagesService`.
 *
 * Purpose:
 *   - Execute and verify the full SKU image saving workflow end-to-end.
 *   - Validate that processed variants (main, thumbnail, zoom) are uploaded and inserted in DB.
 *   - Verify API response transformation using `transformSkuImageResults`.
 *   - Benchmark total runtime and verify log consistency.
 *
 * Usage:
 *   node test-save-sku-images.js
 *
 * Prerequisites:
 *   - `processAndUploadSkuImages`, `insertSkuImagesBulk`, and transformer modules are functional.
 *   - Local image files exist under `/src/assets/sku-images`.
 *   - A valid SKU already exists in the `skus` table.
 *   - Database connection and AWS/S3 (if IS_PROD=true) are configured.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { saveSkuImagesService } = require('../../services/sku-image-service');
const { transformSkuImageResults } = require('../../transformers/sku-image-transformer');

// --- CONFIGURABLE TEST PARAMS ---
const TEST_SKU_CODE = 'PG-TCM300-R-CN';
const IS_PROD = false; // true → upload to S3
const BUCKET_NAME = 'wide-naturals-dev';
const TEST_IMAGES = [
  {
    url: 'src/assets/sku-images/Canaherb/focus_CN.jpg',
    alt_text: 'Front view of Focus China version 11111',
  },
  {
    url: 'src/assets/sku-images/WIDE_Collections/algal_oil_pure_dha_kids_30.png',
    alt_text: 'Side view of Focus China bottle',
  },
];

(async () => {
  const logPrefix = chalk.cyan('[Test: SAVE_SKU_IMAGES]');
  const startTime = performance.now();
  let client;
  
  console.log(`${logPrefix} 🚀 Starting SKU image save service test...`);
  
  try {
    // --- Step 1: Connect to DB ---
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // --- Step 2: Fetch test SKU and user ---
    const { rows: skuRows } = await client.query(
      `SELECT id FROM skus WHERE sku = $1 LIMIT 1;`,
      [TEST_SKU_CODE]
    );
    if (!skuRows.length) throw new Error(`SKU not found: ${TEST_SKU_CODE}`);
    const skuId = skuRows[0].id;
    
    const { rows: userRows } = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    if (!userRows.length) throw new Error('Test user not found: root@widenaturals.com');
    const userId = userRows[0].id;
    
    console.log(`${logPrefix} 👤 Using SKU ${chalk.green(TEST_SKU_CODE)} (${skuId}) by user ${chalk.green(userId)}.`);
    
    // --- Step 3: Execute service ---
    const insertedRows = await saveSkuImagesService(TEST_IMAGES, skuId, TEST_SKU_CODE, userId, IS_PROD, BUCKET_NAME);
    
    if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
      throw new Error('❌ No images were processed or inserted.');
    }
    
    // --- Step 4: Transform results for API preview ---
    const transformed = transformSkuImageResults(insertedRows);
    
    console.log(`${logPrefix} ✅ Transformed API response (${transformed.length} entries):`);
    console.table(
      transformed.map((r) => ({
        id: r.id,
        skuId: r.skuId,
        type: r.imageType,
        order: r.displayOrder,
        primary: r.isPrimary,
      }))
    );
    
    // --- Step 5: Verify DB insert ---
    const { rows: dbRows } = await client.query(
      `SELECT image_type, image_url, file_size_kb, file_format, is_primary
       FROM sku_images
       WHERE sku_id = $1
       ORDER BY display_order ASC;`,
      [skuId]
    );
    
    if (!dbRows.length) throw new Error('❌ No SKU image records found in database.');
    console.log(`${logPrefix} 🔎 Verified ${chalk.green(dbRows.length)} images inserted into DB.`);
    console.table(dbRows);
    
    // --- Step 6: Success summary ---
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logSystemInfo('SKU image save service test completed successfully.', {
      context: 'test-save-sku-images',
      sku: TEST_SKU_CODE,
      processedCount: transformed.length,
      insertedCount: dbRows.length,
      elapsedSeconds: elapsed,
      mode: IS_PROD ? 'prod' : 'dev',
    });
    
    console.log(`${logPrefix} 🏁 Completed successfully in ${chalk.green(`${elapsed}s`)}.`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(error, 'Manual test for saveSkuImagesService failed', {
      context: 'test-save-sku-images',
      sku: TEST_SKU_CODE,
    });
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB connection closed. Exiting.`);
    process.exit(process.exitCode);
  }
})();
