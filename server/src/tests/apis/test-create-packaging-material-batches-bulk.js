/**
 * @fileoverview
 * Manual test script for `createPackagingMaterialBatchesService`.
 *
 * Purpose:
 *   - Execute and verify packaging material batch creation workflow.
 *   - Validate batch registry + activity log creation.
 *   - Inspect DB changes and structured logs.
 *
 * Usage:
 *   node test-create-packaging-material-batches-bulk.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const {
  createPackagingMaterialBatchesService,
} = require('../../services/packaging-material-batch-service');
const { initStatusCache, getStatusId } = require('../../config/status-cache');
const {
  initBatchActivityTypeCache,
} = require('../../cache/batch-activity-type-cache');
const { toLocal } = require('../utlis/convertDate');

(async () => {
  const logPrefix = chalk.cyan('[Test: CREATE_PACKAGING_MATERIAL_BATCHES]');
  const startTime = performance.now();
  
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting packaging material batch creation test...`);
    
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
    // 3. Fetch packaging materials
    // ------------------------------------------------------------
    const { rows: materials } = await client.query(
      `SELECT id, name FROM packaging_materials ORDER BY created_at DESC LIMIT 3`
    );
    
    if (materials.length === 0) {
      throw new Error('No packaging materials found for batch creation test.');
    }
    
    console.log(`${logPrefix} 📦 Using packaging materials`);
    console.table(materials);
    
    // ------------------------------------------------------------
    // 3A. Fetch packaging material supplier relationships
    // ------------------------------------------------------------
    const { rows: materialSuppliers } = await client.query(`
      SELECT
        pms.id,
        pm.name AS material_name,
        s.name AS supplier_name
      FROM packaging_material_suppliers pms
      JOIN packaging_materials pm ON pm.id = pms.packaging_material_id
      JOIN suppliers s ON s.id = pms.supplier_id
      ORDER BY pms.created_at DESC
      LIMIT 3
    `);
    
    if (materialSuppliers.length === 0) {
      throw new Error(
        'No packaging_material_suppliers relationship found for batch creation test.'
      );
    }
    
    console.log(`${logPrefix} 🏭 Using packaging material suppliers`);
    console.table(materialSuppliers);
    
    // ------------------------------------------------------------
    // 4. Prepare batch payloads
    // ------------------------------------------------------------
    const pendingStatusId = getStatusId('batch_pending');
    
    const today = new Date();
    const expiry = new Date();
    expiry.setFullYear(today.getFullYear() + 5);
    
    const randomNotes = [
      'Initial packaging material lot',
      'Supplier verified',
      'Packaging QA passed',
      'Shipment received from supplier',
      'Production support lot',
    ];
    
    const packagingMaterialBatches = materialSuppliers.map((ms, idx) => ({
      packaging_material_supplier_id: ms.id,
      lot_number: `PKG-LOT-${Date.now()}-${idx + 1}`,
      quantity: 5000 + idx * 1000,
      unit: 'pcs',   // required by schema
      manufacture_date: today,
      expiry_date: expiry,
      status_id: pendingStatusId,
      notes: randomNotes[idx % randomNotes.length],
    }));
    
    console.log(`${logPrefix} 🧾 Prepared batch payloads`);
    
    const displayPackagingBatches = packagingMaterialBatches.map((batch) => ({
      lot_number: batch.lot_number,
      quantity: batch.quantity,
      unit: batch.unit,
      manufacture_date: toLocal(batch.manufacture_date),
      expiry_date: toLocal(batch.expiry_date),
      status_date: toLocal(batch.status_date),
      notes: batch.notes ?? '',
    }));
    
    console.table(displayPackagingBatches);
    
    // ------------------------------------------------------------
    // 5. Call service
    // ------------------------------------------------------------
    console.log(`${logPrefix} ▶️ Calling createPackagingMaterialBatchesService...`);
    
    const results = await createPackagingMaterialBatchesService(
      packagingMaterialBatches,
      testUser
    );
    
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('Service returned invalid result.');
    }
    
    console.log(`${logPrefix} ✅ Packaging material batches created successfully`);
    console.table(results);
    
    // ------------------------------------------------------------
    // 6. Verify batches in DB
    // ------------------------------------------------------------
    const ids = results.map((r) => `'${r.id}'`).join(',');
    
    const { rows: batchRows } = await client.query(
      `
      SELECT id, lot_number, packaging_material_supplier_id, quantity, created_at
      FROM packaging_material_batches
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
      SELECT id, packaging_material_batch_id, batch_type, registered_by
      FROM batch_registry
      WHERE packaging_material_batch_id IN (${ids})
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
    
    logSystemInfo('Packaging material batch creation test completed', {
      context: 'test-create-packaging-material-batches',
      batchCount: results.length,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Packaging material batch test failed', {
      context: 'test-create-packaging-material-batches',
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
