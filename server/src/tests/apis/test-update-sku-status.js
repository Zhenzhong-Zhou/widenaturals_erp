/**
 * @fileoverview
 * Manual test script for `updateSkuStatusService`.
 *
 * Purpose:
 *   - Execute and verify the SKU status update service end-to-end.
 *   - Dynamically fetch SKU ID and status ID from the database.
 *   - Validate business logic (SKU status transition rules).
 *   - Benchmark transaction + lock performance and structured logging.
 *
 * Usage:
 *   node test-update-sku-status.js
 *
 * Prerequisites:
 *   - PostgreSQL instance with `skus` and `status` tables populated.
 *   - A valid SKU exists in the DB (identified by its SKU code).
 *   - A system user (e.g. `root@widenaturals.com`) exists.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');

const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { updateSkuStatusService } = require('../../services/sku-service');
const AppError = require('../../utils/AppError');
const { initAllStatusCaches } = require('../../config/status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_SKU_STATUS]');
  const startTime = performance.now();
  let client;
  
  try {
    // Initialize status cache first
    await initAllStatusCaches();
    
    console.log(`${logPrefix} 🚀 Starting SKU status update test...`);
    
    // ------------------------------------------------------------
    // Step 1: Connect to DB
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // ------------------------------------------------------------
    // Step 2: Load system user
    // ------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (users.length === 0) {
      throw new Error('No test user found with email root@widenaturals.com');
    }
    
    const testUser = { id: users[0].id, roleId: users[0].role_id };
    console.log(`${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`);
    
    // ------------------------------------------------------------
    // Step 3: Select SKU by sku code
    // ------------------------------------------------------------
    const testSkuCode = 'CH-HN100-R-CN'; // <--- Change to existing SKU
    const { rows: skuRows } = await client.query(
      `SELECT id, sku, status_id FROM skus WHERE sku = $1 LIMIT 1`,
      [testSkuCode]
    );
    
    if (skuRows.length === 0) {
      throw new AppError.notFoundError(`No SKU found with code: ${testSkuCode}`);
    }
    
    const sku = skuRows[0];
    console.log(`${logPrefix} 📦 Found SKU: ${chalk.yellow(sku.sku)} (id: ${sku.id})`);
    
    // ------------------------------------------------------------
    // Step 4: Select target status
    // ------------------------------------------------------------
    const targetStatusName = 'inactive'; // <--- Change to valid status
    const { rows: statusRows } = await client.query(
      `SELECT id, name FROM status WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [targetStatusName]
    );
    
    if (statusRows.length === 0) {
      throw new AppError.notFoundError(`No status found with name: ${targetStatusName}`);
    }
    
    const targetStatus = statusRows[0];
    console.log(
      `${logPrefix} 🏷️ Target status: ${chalk.green(targetStatus.name)} (${targetStatus.id})`
    );
    
    // ------------------------------------------------------------
    // Step 5: Execute service
    // ------------------------------------------------------------
    console.log(`${logPrefix} ▶️ Calling updateSkuStatusService...`);
    
    const result = await updateSkuStatusService({
      skuId: sku.id,
      statusId: targetStatus.id,
      user: testUser,
    });
    
    if (!result) {
      throw new Error('Service returned null or invalid result.');
    }
    
    console.log(`${logPrefix} ✅ SKU status updated successfully!`);
    console.log(result);
    
    // ------------------------------------------------------------
    // Step 6: Verify from DB
    // ------------------------------------------------------------
    const { rows: verifyRows } = await client.query(
      `SELECT s.id, s.sku, st.name AS status_name, s.updated_at
       FROM skus s
       LEFT JOIN status st ON s.status_id = st.id
       WHERE s.id = $1`,
      [sku.id]
    );
    
    console.log(`${logPrefix} 🔎 Verified updated SKU status:`);
    console.table(verifyRows[0]);
    
    // ------------------------------------------------------------
    // Step 7: Timing + final log
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('SKU status update test completed successfully', {
      context: 'test-update-sku-status',
      skuId: sku.id,
      newStatusId: targetStatus.id,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}.`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Manual test for updateSkuStatusService failed', {
      context: 'test-update-sku-status',
    });
    
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released.`);
    
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed.`);
    
    process.exit(process.exitCode);
  }
})();
