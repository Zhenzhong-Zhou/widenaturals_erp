/**
 * Test Script: UPDATE_SKU_DIMENSIONS
 *
 * Performs a controlled dimension update on a SKU,
 * verifies DB state, then restores original values.
 *
 * - Service manages its own transaction.
 * - Script uses pool.query() for read-only operations.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const { updateSkuDimensionsService } = require('../../services/sku-service');
const { initAllStatusCaches } = require('../../config/status-cache');
const {
  initSkuOperationalStatusCache,
} = require('../../config/sku-operational-status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_SKU_DIMENSIONS]');
  const startTime = performance.now();
  const context = 'test-update-sku-dimensions';

  const testSkuCode = 'CH-HN100-R-CN';
  const testUserEmail = 'jp@widenaturals.com';

  let skuId = null;
  let originalDimensions = null;
  let testUser = null;

  try {
    await initAllStatusCaches();
    await initSkuOperationalStatusCache();

    console.log(`${logPrefix} 🚀 Starting dimensions update test...`);

    // ----------------------------------------
    // Step 1: Load SKU
    // ----------------------------------------
    const skuRes = await pool.query(
      `
      SELECT id,
             length_cm,
             width_cm,
             height_cm,
             weight_g
      FROM skus
      WHERE sku = $1
      LIMIT 1
      `,
      [testSkuCode]
    );

    if (!skuRes.rows.length) {
      throw new Error(`SKU not found: ${testSkuCode}`);
    }

    const skuRow = skuRes.rows[0];
    skuId = skuRow.id;

    originalDimensions = {
      length_cm: skuRow.length_cm,
      width_cm: skuRow.width_cm,
      height_cm: skuRow.height_cm,
      weight_g: skuRow.weight_g,
    };

    console.log(`${logPrefix} 📦 Found SKU ID: ${skuId}`);

    // ----------------------------------------
    // Step 2: Load test user (once)
    // ----------------------------------------
    const userRes = await pool.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      [testUserEmail]
    );

    if (!userRes.rows.length) {
      throw new Error(`Test user not found: ${testUserEmail}`);
    }

    testUser = {
      id: userRes.rows[0].id,
      role: userRes.rows[0].role_id,
    };

    console.log(`${logPrefix} 👤 Using user: ${testUser.id}`);

    // ----------------------------------------
    // Step 3: Execute update
    // ----------------------------------------
    console.log(`${logPrefix} ▶️ Updating dimensions...`);

    const result = await updateSkuDimensionsService({
      skuId,
      payload: {
        length_cm: 20,
        width_cm: 10,
        height_cm: 5,
        weight_g: 450,
      },
      user: testUser,
    });

    console.log(`${logPrefix} ✅ Service returned`);
    console.table({
      length_cm: result.length_cm,
      width_cm: result.width_cm,
      height_cm: result.height_cm,
      weight_g: result.weight_g,
    });

    // ----------------------------------------
    // Step 4: Verify from DB
    // ----------------------------------------
    const verifyRes = await pool.query(
      `
      SELECT
        length_cm,
        width_cm,
        height_cm,
        weight_g,
        length_inch,
        width_inch,
        height_inch,
        weight_lb,
        updated_at
      FROM skus
      WHERE id = $1
      `,
      [skuId]
    );

    console.log(`${logPrefix} 🔎 Verified DB state:`);
    console.table(verifyRes.rows[0]);

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

    logSystemInfo('SKU dimension update test completed', {
      context,
      skuId,
      elapsedSeconds: elapsed,
    });

    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ ${chalk.red(error.message)}`);
    logSystemException(error, 'SKU dimension test failed', { context });
    process.exitCode = 1;
  } finally {
    // ----------------------------------------
    // Always restore original dimensions
    // ----------------------------------------
    if (skuId && originalDimensions && testUser?.id) {
      try {
        console.log(`${logPrefix} 🔄 Restoring original dimensions...`);

        await updateSkuDimensionsService({
          skuId,
          payload: originalDimensions,
          user: testUser,
        });

        console.log(`${logPrefix} ♻️ Original dimensions restored`);
      } catch (restoreErr) {
        console.error(
          `${logPrefix} ⚠️ Restore failed: ${chalk.red(restoreErr.message)}`
        );
        logSystemException(restoreErr, 'SKU dimension restore failed', {
          context,
          skuId,
        });
      }
    }

    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB pool closed`);
  }
})();
