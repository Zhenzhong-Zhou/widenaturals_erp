/**
 * @fileoverview
 * Manual integration test for `saveBulkSkuImagesService`.
 *
 * Purpose:
 *   - Validate full multi-SKU image upload workflow end-to-end.
 *   - Ensure each SKU’s image variants (main, thumbnail, zoom) are processed and inserted correctly.
 *   - Benchmark total runtime and concurrent transaction handling.
 *
 * Usage:
 *   node server/src/tests/apis/test-save-bulk-sku-images.js
 *
 * Prerequisites:
 *   - The `saveBulkSkuImagesService` and dependent modules are functional.
 *   - Local image files exist under `/src/assets/sku-images/`.
 *   - Target SKUs exist in the `skus` table.
 *   - Database connection and (optional) AWS/S3 credentials configured.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { saveBulkSkuImagesService } = require('../../services/sku-image-service');

// --- CONFIGURABLE TEST SETTINGS ---
const IS_PROD = false; // true → uploads to S3
const BUCKET_NAME = 'wide-naturals-dev';

// --- Define multiple SKUs with image sets ---
const BULK_IMAGE_SETS = [
  {
    skuCode: 'ZZ-XX500-R-CN',
    images: [
      {
        url: 'src/assets/sku-images/Canaherb/focus_CA.jpg',
        alt_text: 'Front view - Focus CA',
      },
      {
        url: 'src/assets/sku-images/WIDE_Collections/focus_side_CA.png',
        alt_text: 'Side view - Focus CA',
      },
    ],
  },
  {
    skuCode: 'AB-CD700-R-CN',
    images: [
      {
        url: 'src/assets/sku-images/Canaherb/memory_CN.jpg',
        alt_text: 'Front view - Memory CN',
      },
      {
        url: 'src/assets/sku-images/WIDE_Collections/memory_box_CN.png',
        alt_text: 'Box packaging - Memory CN',
      },
    ],
  },
  {
    skuCode: 'WN-MO400-S-UN',
    images: [
      {
        url: 'src/assets/sku-images/WIDE_Collections/mood_UN_front.jpg',
        alt_text: 'Front label - Mood UN',
      },
      {
        url: 'src/assets/sku-images/WIDE_Collections/mood_UN_side.png',
        alt_text: 'Side label - Mood UN',
      },
    ],
  },
];

(async () => {
  const logPrefix = chalk.cyan('[Test: SAVE_BULK_SKU_IMAGES]');
  const start = performance.now();
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting bulk SKU image upload test...`);
    client = await pool.connect();
    
    // --- Step 1: Fetch SKU IDs and test user ---
    console.log(`${logPrefix} 🔍 Resolving SKU IDs from DB...`);
    
    const skuMap = {};
    for (const { skuCode } of BULK_IMAGE_SETS) {
      const { rows } = await client.query(`SELECT id FROM skus WHERE sku = $1 LIMIT 1;`, [skuCode]);
      if (!rows.length) throw new Error(`❌ SKU not found: ${skuCode}`);
      skuMap[skuCode] = rows[0].id;
    }
    
    const { rows: userRows } = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    if (!userRows.length) throw new Error('Test user not found: root@widenaturals.com');
    const user = { id: userRows[0].id, email: 'root@widenaturals.com' };
    
    console.log(`${logPrefix} 👤 Using test user ${chalk.green(user.email)} (${user.id}).`);
    console.log(`${logPrefix} 📦 Preparing ${BULK_IMAGE_SETS.length} SKU image sets...`);
    
    // --- Step 2: Build service payload ---
    const skuImageSets = BULK_IMAGE_SETS.map(({ skuCode, images }) => ({
      skuId: skuMap[skuCode],
      skuCode,
      images,
    }));
    
    // --- Step 3: Execute bulk service ---
    const results = await saveBulkSkuImagesService(skuImageSets, user, IS_PROD, BUCKET_NAME);
    
    // --- Step 4: Log results summary ---
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);
    const totalElapsed = ((performance.now() - start) / 1000).toFixed(2);
    
    console.log(`${logPrefix} ✅ Bulk SKU image upload completed.`);
    console.table(
      results.map((r) => ({
        skuId: r.skuId,
        success: r.success ? '✅' : '❌',
        count: r.count,
        error: r.error || '',
      }))
    );
    
    if (failed.length > 0) {
      console.warn(chalk.yellow(`${logPrefix} ⚠️ Some SKUs failed to upload:`));
      failed.forEach((f) => console.warn(`  - ${f.skuId}: ${f.error}`));
    }
    
    logSystemInfo('Bulk SKU image upload test completed', {
      context: 'test-save-bulk-sku-images',
      successCount: succeeded,
      failedCount: failed.length,
      totalElapsedSeconds: totalElapsed,
      totalSkuSets: results.length,
      mode: IS_PROD ? 'prod' : 'dev',
    });
    
    console.log(`${logPrefix} 🏁 Done in ${chalk.green(`${totalElapsed}s`)}.`);
    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(error, 'Manual test for saveBulkSkuImagesService failed', {
      context: 'test-save-bulk-sku-images',
    });
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB connection closed. Exiting.`);
    process.exit(process.exitCode);
  }
})();
