/**
 * Manual Test Script: UPDATE_SKU_METADATA
 *
 * Performs a controlled metadata update on a SKU,
 * verifies DB state, then restores original values.
 *
 * Service manages its own transaction.
 * Script uses pool.query() for read-only operations.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const { updateSkuMetadataService } = require('../../services/sku-service');
const { initAllStatusCaches } = require('../../config/status-cache');
const {
  initSkuOperationalStatusCache,
} = require('../../config/sku-operational-status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_SKU_METADATA]');
  const startTime = performance.now();
  const context = 'test-update-sku-metadata';

  const testSkuCode = 'CH-HN100-R-CN';
  const testUserEmail = 'root@widenaturals.com';

  let skuId = null;
  let originalMetadata = null;
  let testUser = null;

  try {
    await initAllStatusCaches();
    await initSkuOperationalStatusCache();

    console.log(`${logPrefix} 🚀 Starting metadata update test...`);

    // ----------------------------------------
    // Step 1: Load SKU + original metadata
    // ----------------------------------------
    const skuRes = await pool.query(
      `
      SELECT id, description, size_label, language, market_region
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

    originalMetadata = {
      description: skuRow.description,
      size_label: skuRow.size_label,
      language: skuRow.language,
      market_region: skuRow.market_region,
    };

    console.log(`${logPrefix} 📦 Found SKU ID: ${skuId}`);

    // ----------------------------------------
    // Step 2: Load test user once
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
    // Step 3: Execute metadata update
    // ----------------------------------------
    console.log(`${logPrefix} ▶️ Updating metadata...`);

    const result = await updateSkuMetadataService({
      skuId,
      payload: {
        description: 'Updated via metadata test',
        size_label: '100 Capsules',
      },
      user: testUser,
    });

    console.log(`${logPrefix} ✅ Service returned`);
    console.table({
      description: result.description,
      size_label: result.size_label,
    });

    // ----------------------------------------
    // Step 4: Verify DB state
    // ----------------------------------------
    const verifyRes = await pool.query(
      `
      SELECT description, size_label, language, market_region, updated_at
      FROM skus
      WHERE id = $1
      `,
      [skuId]
    );

    console.log(`${logPrefix} 🔎 Verified DB state:`);
    console.table(verifyRes.rows[0]);

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

    logSystemInfo('SKU metadata update test completed', {
      context,
      skuId,
      elapsedSeconds: elapsed,
    });

    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ ${chalk.red(error.message)}`);
    logSystemException(error, 'SKU metadata test failed', { context });
    process.exitCode = 1;
  } finally {
    // ----------------------------------------
    // Always restore original metadata
    // ----------------------------------------
    if (skuId && originalMetadata && testUser?.id) {
      try {
        console.log(`${logPrefix} 🔄 Restoring original metadata...`);

        await updateSkuMetadataService({
          skuId,
          payload: originalMetadata,
          user: testUser,
        });

        console.log(`${logPrefix} ♻️ Original metadata restored`);
      } catch (restoreErr) {
        console.error(
          `${logPrefix} ⚠️ Restore failed: ${chalk.red(restoreErr.message)}`
        );
        logSystemException(restoreErr, 'SKU metadata restore failed', {
          context,
          skuId,
        });
      }
    }

    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB pool closed`);
  }
})();
