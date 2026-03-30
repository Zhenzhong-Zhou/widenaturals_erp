/**
 * @fileoverview
 * Manual test script for `createProductBatchesService`.
 *
 * Purpose:
 *   - Execute and verify product batch creation workflow.
 *   - Validate batch registry + activity log creation.
 *   - Inspect DB changes and structured logs.
 *
 * Usage:
 *   node test-create-product-batches-bulk.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const {
  createProductBatchesService,
} = require('../../services/product-batch-service');
const { initStatusCache, getStatusId } = require('../../config/status-cache');
const {
  initBatchActivityTypeCache,
} = require('../../cache/batch-activity-type-cache');
const { toLocal } = require('../utlis/convertDate');

(async () => {
  const logPrefix = chalk.cyan('[Test: CREATE_PRODUCT_BATCHES]');
  const startTime = performance.now();
  
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting product batch creation test...`);
    
    // ------------------------------------------------------------
    // 1. Connect to DB
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    await initStatusCache();
    await initBatchActivityTypeCache();
    
    // ------------------------------------------------------------
    // 2. Load test user
    // ------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (users.length === 0)
      throw new Error('Test user root@widenaturals.com not found');
    
    const testUser = {
      id: users[0].id,
      roleId: users[0].role_id,
    };
    
    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );
    
    // ------------------------------------------------------------
    // 3. Fetch some SKUs to attach batches
    // ------------------------------------------------------------
    const { rows: skus } = await client.query(
      `SELECT id, sku FROM skus ORDER BY created_at DESC LIMIT 3`
    );
    
    if (skus.length === 0) {
      throw new Error('No SKUs found for batch creation test.');
    }
    
    console.log(`${logPrefix} 📦 Using SKUs for batch creation`);
    console.table(skus);
    
    // ------------------------------------------------------------
    // 3A. Fetch a manufacturer
    // ------------------------------------------------------------
    const { rows: manufacturers } = await client.query(
      `SELECT id, name FROM manufacturers LIMIT 1`
    );
    
    if (manufacturers.length === 0) {
      throw new Error('No manufacturer found for batch creation test.');
    }
    
    const manufacturerId = manufacturers[0].id;
    
    console.log(`${logPrefix} 🏭 Using manufacturer`);
    console.table(manufacturers);
    
    // ------------------------------------------------------------
    // 4. Prepare batch payloads
    // ------------------------------------------------------------
    const pendingStatusId = getStatusId('batch_pending');
    
    const today = new Date();
    const expiry = new Date();
    expiry.setFullYear(today.getFullYear() + 3);
    
    const randomNotes = [
      'Initial manufacturing batch',
      'Quality inspection passed',
      'Production line A',
      'Packaging verified',
      'First production lot',
    ];
    
    const productBatches = skus.map((sku, idx) => ({
      lot_number: `LOT-${Date.now()}-${idx + 1}`,
      sku_id: sku.id,
      manufacturer_id: manufacturerId,
      manufacture_date: today,
      expiry_date: expiry,
      initial_quantity: 1000 + idx * 500,
      status_id: pendingStatusId,
      notes: randomNotes[idx % randomNotes.length],
    }));
    
    console.log(`${logPrefix} 🧾 Prepared batch payloads`);
    
    const displayBatches = productBatches.map((batch) => ({
      sku_id: batch.sku_id,
      lot_number: batch.lot_number,
      manufacture_date: toLocal(batch.manufacture_date),
      expiry_date: toLocal(batch.expiry_date),
      initial_quantity: batch.initial_quantity,
      status_date: toLocal(batch.status_date),
      notes: batch.notes ?? '',
    }));
    
    console.table(displayBatches);
    
    // ------------------------------------------------------------
    // 5. Call service
    // ------------------------------------------------------------
    console.log(`${logPrefix} ▶️ Calling createProductBatchesService...`);
    
    const results = await createProductBatchesService(
      productBatches,
      testUser
    );
    
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Service returned invalid result.');
    }
    
    console.log(`${logPrefix} ✅ Product batches created successfully`);
    console.table(results);
    
    // ------------------------------------------------------------
    // 6. Verify batches from DB
    // ------------------------------------------------------------
    const ids = results.map((r) => `'${r.id}'`).join(',');
    
    const { rows: batchRows } = await client.query(
      `
      SELECT id, lot_number, sku_id, initial_quantity, created_at
      FROM product_batches
      WHERE id IN (${ids})
      ORDER BY created_at DESC
      `
    );
    
    console.log(`${logPrefix} 🔎 Verified batches in database`);
    console.table(batchRows);
    
    // ------------------------------------------------------------
    // 7. Verify batch registry
    // ------------------------------------------------------------
    const { rows: registryRows } = await client.query(
      `
      SELECT id, product_batch_id, batch_type, registered_by
      FROM batch_registry
      WHERE product_batch_id IN (${ids})
      `
    );
    
    console.log(`${logPrefix} 📋 Verified batch registry`);
    console.table(registryRows);
    
    // ------------------------------------------------------------
    // 8. Verify activity logs
    // ------------------------------------------------------------
    const registryIds = registryRows.map((r) => `'${r.id}'`).join(',');
    
    const { rows: activityRows } = await client.query(
      `
      SELECT id, batch_registry_id, batch_activity_type_id, changed_at
      FROM batch_activity_logs
      WHERE batch_registry_id IN (${registryIds})
      `
    );
    
    console.log(`${logPrefix} 📜 Verified activity logs`);
    console.table(activityRows);
    
    // ------------------------------------------------------------
    // 9. Performance timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('Product batch creation test completed', {
      context: 'test-create-product-batches',
      batchCount: results.length,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Product batch test failed', {
      context: 'test-create-product-batches',
    });
    
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released`);
    
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed`);
    
    process.exit(process.exitCode);
  }
})();
