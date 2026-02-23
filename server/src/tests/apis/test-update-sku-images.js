/**
 * @fileoverview
 * Manual test script for `updateSkuImagesService`.
 *
 * Purpose:
 *   - Validate metadata update (alt_text, display_order)
 *   - Validate primary switching logic
 *   - Validate optional file replacement flow
 *   - Ensure no duplicate primary images
 *
 * Usage:
 *   node test-update-sku-images.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const {
  updateSkuImagesService,
} = require('../../services/sku-image-service');

const TEST_SKU_CODE = 'PG-NM211-M-AX';
const IS_PROD = false;
const BUCKET_NAME = 'wide-naturals-dev';

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_SKU_IMAGES]');
  const startTime = performance.now();
  let client;
  
  console.log(`${logPrefix} 🚀 Starting SKU image update test...`);
  
  try {
    client = await pool.connect();
    
    // ------------------------------------------------------------
    // Step 1: Fetch SKU + user
    // ------------------------------------------------------------
    const { rows: skuRows } = await client.query(
      `SELECT id FROM skus WHERE sku = $1 LIMIT 1;`,
      [TEST_SKU_CODE]
    );
    
    if (!skuRows.length)
      throw new Error(`SKU not found: ${TEST_SKU_CODE}`);
    
    const skuId = skuRows[0].id;
    
    const { rows: userRows } = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    
    if (!userRows.length)
      throw new Error('Test user not found.');
    
    const user = { id: userRows[0].id };
    
    // ------------------------------------------------------------
    // Step 2: Fetch existing images
    // ------------------------------------------------------------
    const { rows: existingGroups } = await client.query(
      `
        SELECT DISTINCT group_id
        FROM sku_images
        WHERE sku_id = $1
        ORDER BY group_id
      `,
      [skuId]
    );
    
    if (!existingGroups.length) {
      throw new Error('No image groups exist for this SKU.');
    }
    
    console.log(
      `${logPrefix} 📦 Found ${existingGroups.length} image groups.`
    );
    
    // ------------------------------------------------------------
    // Step 3: Prepare update payload
    // ------------------------------------------------------------
    const updates = existingGroups.map((group, index) => ({
      group_id: group.group_id,
      alt_text: `Updated alt text group ${index}`,
      display_order: index * 10,
      is_primary: index === 0,
    }));

    // Optional file replacement simulation (first group only)
    updates[0].image_url =
      'src/assets/sku-images/Canaherb/hair_health.jpg';
    updates[0].file_uploaded = true;
    
    // ------------------------------------------------------------
    // Step 4: Execute update service
    // ------------------------------------------------------------
    const result = await updateSkuImagesService(
      updates,
      skuId,
      TEST_SKU_CODE,
      user,
      IS_PROD,
      BUCKET_NAME,
      client
    );
    
    if (!Array.isArray(result) || !result.length) {
      throw new Error('No images updated.');
    }
    
    console.log(
      `${logPrefix} ✅ Updated ${chalk.green(result.length)} images.`
    );
    
    // ------------------------------------------------------------
    // Step 5: Verify primary uniqueness
    // ------------------------------------------------------------
    const { rows: primaryRows } = await client.query(
      `
        SELECT COUNT(DISTINCT group_id)::int AS count
        FROM sku_images
        WHERE sku_id = $1
          AND is_primary = TRUE
      `,
      [skuId]
    );
    
    if (primaryRows[0].count !== 1) {
      throw new Error('Primary constraint violated.');
    }
    
    console.log(
      `${logPrefix} ⭐ Verified exactly one primary image.`
    );
    
    // ------------------------------------------------------------
    // Step 6: Verify updated metadata
    // ------------------------------------------------------------
    const { rows: dbRows } = await client.query(
      `
      SELECT id, alt_text, display_order, is_primary
      FROM sku_images
      WHERE sku_id = $1
      ORDER BY display_order ASC
      `,
      [skuId]
    );
    
    console.table(dbRows);
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('SKU image update test completed.', {
      context: 'test-update-sku-images',
      sku: TEST_SKU_CODE,
      updatedCount: result.length,
      elapsedSeconds: elapsed,
    });
    
    console.log(
      `${logPrefix} 🏁 Completed successfully in ${chalk.green(`${elapsed}s`)}`
    );
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Manual test failed', {
      context: 'test-update-sku-images',
      sku: TEST_SKU_CODE,
    });
    
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB connection closed.`);
    process.exit(process.exitCode);
  }
})();
