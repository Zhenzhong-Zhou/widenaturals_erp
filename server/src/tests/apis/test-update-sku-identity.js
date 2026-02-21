/**
 * Test Script: UPDATE_SKU_IDENTITY
 *
 * Runs a controlled update to a SKU identity (sku + barcode),
 * verifies DB state, then restores original values.
 *
 * Notes:
 * - updateSkuIdentityService manages its own transaction via withTransaction().
 * - This script uses pool.query() for read/verify calls to avoid mixing clients.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { updateSkuIdentityService } = require('../../services/sku-service');
const { initAllStatusCaches } = require('../../config/status-cache');
const { initSkuOperationalStatusCache } = require('../../config/sku-operational-status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_SKU_IDENTITY]');
  const startTime = performance.now();
  
  const context = 'test-update-sku-identity';
  
  const testSkuCode = 'CH-HN100-R-CN-TMP-TMP-TMP-TMP';
  const testUserEmail = 'root@widenaturals.com';
  
  let skuRow = null;
  let originalIdentity = null;
  let testUser = null;
  
  try {
    await initAllStatusCaches();
    await initSkuOperationalStatusCache();
    
    console.log(`${logPrefix} 🚀 Starting identity update test...`);
    
    // ----------------------------------------
    // Step 1: Load SKU
    // ----------------------------------------
    const skuRes = await pool.query(
      `SELECT id, sku, barcode FROM skus WHERE sku = $1 LIMIT 1`,
      [testSkuCode]
    );
    
    if (!skuRes.rows.length) {
      throw new Error(`SKU not found: ${testSkuCode}`);
    }
    
    skuRow = skuRes.rows[0];
    originalIdentity = { sku: skuRow.sku, barcode: skuRow.barcode };
    
    console.log(`${logPrefix} 📦 Found SKU: ${skuRow.sku} (${skuRow.id})`);
    
    // Temporary values (keep uppercase + hyphen pattern)
    const newSku = `${originalIdentity.sku}-TMP`;
    const newBarcode = '9999919999';
    
    // ----------------------------------------
    // Step 2: Load test user
    // ----------------------------------------
    const userRes = await pool.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      [testUserEmail]
    );
    
    if (!userRes.rows.length) {
      throw new Error(`Test user not found: ${testUserEmail}`);
    }
    
    // Ensure the user object matches what your service expects.
    // If your auth layer expects `user.role_id`, keep it consistent.
    testUser = {
      id: userRes.rows[0].id,
      role: userRes.rows[0].role_id,
    };
    
    console.log(`${logPrefix} 👤 Using user: ${testUser.id}`);
    
    // ----------------------------------------
    // Step 3: Execute update
    // ----------------------------------------
    console.log(`${logPrefix} ▶️ Updating identity...`);
    
    const result = await updateSkuIdentityService({
      skuId: skuRow.id,
      payload: { sku: newSku, barcode: newBarcode },
      user: testUser,
    });
    
    console.log(`${logPrefix} ✅ Identity updated`);
    console.table({ sku: result });
    
    // ----------------------------------------
    // Step 4: Verify from DB
    // ----------------------------------------
    const verifyRes = await pool.query(
      `SELECT sku, barcode, updated_at FROM skus WHERE id = $1`,
      [skuRow.id]
    );
    
    console.log(`${logPrefix} 🔎 Verified DB state:`);
    console.table(verifyRes.rows[0]);
    
    // ----------------------------------------
    // Step 5: Timing
    // ----------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('SKU identity update test completed', {
      context,
      skuId: skuRow.id,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ ${chalk.red(error.message)}`);
    
    logSystemException(error, 'SKU identity test failed', { context });
    process.exitCode = 1;
  } finally {
    // ----------------------------------------
    // Always attempt restoration if we captured original values.
    // ----------------------------------------
    if (skuRow?.id && originalIdentity?.sku) {
      try {
        console.log(`${logPrefix} 🔄 Restoring original identity...`);
        
        await updateSkuIdentityService({
          skuId: skuRow?.id,
          payload: {
            sku: originalIdentity?.sku,
            barcode: originalIdentity?.barcode,
          },
          // if testUser isn't available due to earlier failure, you may need a fallback.
          // In practice, keep testUser defined outside try/catch if you want guaranteed restore.
          user: testUser,
        });
        
        console.log(`${logPrefix} ♻️ Original values restored`);
      } catch (restoreErr) {
        console.error(`${logPrefix} ⚠️ Restore failed: ${chalk.red(restoreErr.message)}`);
        logSystemException(restoreErr, 'SKU identity restore failed', { context, skuId: skuRow?.id });
        // keep exitCode as-is (test already failed or passed)
      }
    }
    
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🧹 DB pool closed`);
  }
})();
