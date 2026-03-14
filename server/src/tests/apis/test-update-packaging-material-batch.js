/**
 * @fileoverview
 * Manual test script for `packagingMaterialBatchAdjustService`
 *
 * Tests:
 *   1. Editable packaging batch metadata update
 *   2. Locked packaging batch rejection
 *
 * Usage:
 *   node test-packaging-material-batch-adjust-metadata.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { randomUUID } = require('crypto');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const {
  editPackagingMaterialBatchMetadataService,
} = require('../../services/packaging-material-batch-service');
const { initStatusCache } = require('../../config/status-cache');
const {
  initBatchActivityTypeCache,
} = require('../../cache/batch-activity-type-cache');
const { runTestCase } = require('../utlis/runTestCase');
const { fetchBatchRecord, fetchBatchActivityLog } = require('../utlis/batches/batch-test-helpers');

(async () => {
  const logPrefix = chalk.cyan('[Test: PACKAGING_BATCH_METADATA_UPDATE]');
  const startTime = performance.now();
  
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting metadata update tests`);
    
    //------------------------------------------------------------
    // 1. Connect DB
    //------------------------------------------------------------
    
    client = await pool.connect();
    
    console.log(`${logPrefix} ✅ Database connected`);
    
    await initStatusCache();
    await initBatchActivityTypeCache();
    
    //------------------------------------------------------------
    // 2. Load test users
    //------------------------------------------------------------
    
    const { rows: allowedUsers } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    
    if (!allowedUsers.length) {
      throw new Error('No allowed test user found with email jp@widenaturals.com');
    }
    
    const allowedUser = {
      id: allowedUsers[0].id,
      role: allowedUsers[0].role_id
    };
    
    console.log(
      `${logPrefix} 👤 Using allowed test user: ${chalk.green(JSON.stringify(allowedUser))}`
    );
    
    const { rows: deniedUsers } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1;`,
      ['jp@widenaturals.com']
    );
    
    if (!deniedUsers.length) {
      throw new Error('No denied test user found with expected restricted role');
    }
    
    const deniedUser = {
      id: deniedUsers[0].id,
      role: deniedUsers[0].role_id
    };
    
    console.log(
      `${logPrefix} 🚫 Using denied test user: ${chalk.green(JSON.stringify(deniedUser))}`
    );
    
    //------------------------------------------------------------
    // 3. Fetch editable batch
    //------------------------------------------------------------
    
    const { rows: editableRows } = await client.query(`
      SELECT
        pb.id,
        br.id AS batch_registry_id,
        pb.status_id,
        bs.name AS status_name
      FROM packaging_material_batches pb
      JOIN batch_registry br
        ON br.packaging_material_batch_id = pb.id
      JOIN batch_status bs
        ON bs.id = pb.status_id
      WHERE bs.name = 'pending'
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (!editableRows.length) {
      throw new Error('No pending packaging batch found');
    }
    
    const editableBatch = editableRows[0];
    
    console.log(`${logPrefix} 📦 Editable packaging batch`);
    console.table(editableBatch);
    
    //------------------------------------------------------------
    // 4. Fetch packaging material supplier
    //------------------------------------------------------------
    
    const { rows: supplierRows } = await client.query(`
      SELECT id
      FROM packaging_material_suppliers
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (!supplierRows.length) {
      throw new Error('No packaging material supplier found');
    }
    
    const packagingMaterialSupplierId = supplierRows[0].id;
    
    console.log(`${logPrefix} 🏭 Using supplier: ${chalk.green(packagingMaterialSupplierId)}`);
    
    //------------------------------------------------------------
    // 5. Prepare update payload
    //------------------------------------------------------------
    
    const lotNumber =`LOT-PACK-${randomUUID()}`;
    
    const updates = {
      packaging_material_supplier_id: packagingMaterialSupplierId,
      lot_number: lotNumber,
      material_snapshot_name: 'Amber Glass Bottle 250ml',
      received_label_name: 'Bottle 250ml Supplier Label',
      quantity: Math.floor(Math.random() * 5000 + 1000),
      unit: 'pcs',
      manufacture_date: '2026-01-15',
      expiry_date: '2031-01-15',
      unit_cost: 0.45,
      currency: 'USD',
      exchange_rate: 1.35,
      total_cost: 9000,
      notes: `Cost adjusted after invoice reconciliation ${Date.now()}`
    };
    
    console.log(`${logPrefix} 📝 Update payload`);
    console.table(updates);
    
    //------------------------------------------------------------
    // Test Case 1 — Editable batch metadata update
    //------------------------------------------------------------
    
    const editableCase = await runTestCase(
      'Editable packaging batch metadata update',
      async () => {
        const result =
          await editPackagingMaterialBatchMetadataService(
            editableBatch.id,
            updates,
            allowedUser
          );
        
        return {
          batchId: editableBatch.id,
          batchRegistryId: editableBatch.batch_registry_id,
          result
        };
      }
    );
    
    //------------------------------------------------------------
    // Test Case 2 — Partial metadata update
    //------------------------------------------------------------
    
    const partialUpdateCase = await runTestCase(
      'Partial metadata update (notes only)',
      async () => {
        
        const result =
          await editPackagingMaterialBatchMetadataService(
            editableBatch.id,
            { notes: `Partial update ${Date.now()}` },
            allowedUser
          );
        
        return {
          batchId: editableBatch.id,
          batchRegistryId: editableBatch.batch_registry_id,
          result
        };
      }
    );
    
    //------------------------------------------------------------
    // Test Case 3 — Locked batch rejection
    //------------------------------------------------------------
    
    const lockedCase = await runTestCase(
      'Locked packaging batch should reject update',
      async () => {
        const { rows } = await client.query(`
          SELECT pb.id, br.id AS batch_registry_id
          FROM packaging_material_batches pb
          JOIN batch_registry br
            ON br.packaging_material_batch_id = pb.id
          JOIN batch_status bs
            ON bs.id = pb.status_id
          WHERE bs.name <> 'pending'
          ORDER BY RANDOM()
          LIMIT 1
        `);
        
        if (!rows.length) {
          throw new Error('No locked packaging batch available');
        }
        
        const lockedBatch = rows[0];
        
        try {
          await editPackagingMaterialBatchMetadataService(
            lockedBatch.id,
            updates,
            allowedUser
          );
          
          throw new Error('Expected lifecycle rejection');
        } catch (err) {
          return {
            batchId: lockedBatch.id,
            expectedError: err.message
          };
        }
      }
    );
    
    //------------------------------------------------------------
    // Test Case 4 — Permission rejection
    //------------------------------------------------------------
    
    const permissionCase = await runTestCase(
      'Permission rejection for editable batch',
      async () => {
        try {
          await editPackagingMaterialBatchMetadataService(
            editableBatch.id,
            updates,
            deniedUser
          );
          
          throw new Error('Expected permission rejection');
        } catch (err) {
          return {
            batchId: editableBatch.id,
            expectedError: err.message
          };
        }
      }
    );
    
    //------------------------------------------------------------
    // Test Case 5 — Invalid field update
    //------------------------------------------------------------
    
    const invalidFieldCase = await runTestCase(
      'Invalid field update should reject',
      async () => {
        try {
          await editPackagingMaterialBatchMetadataService(
            editableBatch.id,
            {
              invalid_field: 'test'
            },
            allowedUser
          );
          
          throw new Error('Expected invalid field rejection');
        } catch (err) {
          return {
            batchId: editableBatch.id,
            expectedError: err.message
          };
        }
      }
    );
    
    //------------------------------------------------------------
    // Test Case 6 — Empty update payload
    //------------------------------------------------------------
    
    const emptyPayloadCase = await runTestCase(
      'Empty payload should reject',
      async () => {
        try {
          await editPackagingMaterialBatchMetadataService(
            editableBatch.id,
            {},
            allowedUser
          );
          
          throw new Error('Expected empty payload rejection');
        } catch (err) {
          return {
            expectedError: err.message
          };
        }
      }
    );
    
    //------------------------------------------------------------
    // Test Case 7 — Batch not found
    //------------------------------------------------------------
    
    const notFoundCase = await runTestCase(
      'Non-existent batch should reject',
      async () => {
        try {
          await editPackagingMaterialBatchMetadataService(
            '00000000-0000-0000-0000-000000000000',
            updates,
            allowedUser
          );
          
          throw new Error('Expected not-found rejection');
        } catch (err) {
          return {
            expectedError: err.message
          };
        }
      }
    );
    
    //------------------------------------------------------------
    // 5. Verify editable update
    //------------------------------------------------------------

    // Editable update verification
    if (editableCase.success) {
      console.log(`${logPrefix} 🔎 Verifying batch update`);
      
      const batch = await fetchBatchRecord(
        client,
        editableCase.result.batchId,
        'packaging_material_batches',
      );
      
      console.table(batch);
      
      console.log(`${logPrefix} 📜 Verifying activity log`);
      
      const activity = await fetchBatchActivityLog(
        client,
        editableCase.result.batchRegistryId,
        'BATCH_METADATA_UPDATED'
      );
      
      console.table(activity);
    }
    
    // Partial update verification
    if (partialUpdateCase?.success) {
      console.log(`${logPrefix} ✏️ Partial metadata update confirmed`);
      console.table(partialUpdateCase.result);
    }
    
    // Locked batch verification
    if (lockedCase.success) {
      console.log(`${logPrefix} 🔒 Locked batch rejection confirmed`);
      console.table(lockedCase.result);
    }
    
    // Permission rejection verification
    if (permissionCase.success) {
      console.log(`${logPrefix} 🚫 Permission rejection confirmed`);
      console.table(permissionCase.result);
    }
    
    // Invalid field rejection verification
    if (invalidFieldCase?.success) {
      console.log(`${logPrefix} ⚠️ Invalid field rejection confirmed`);
      console.table(invalidFieldCase.result);
    }

    // Empty payload rejection verification
    if (emptyPayloadCase?.success) {
      console.log(`${logPrefix} ⚠️ Empty payload rejection confirmed`);
      console.table(emptyPayloadCase.result);
    }

    // Batch not found verification
    if (notFoundCase?.success) {
      console.log(`${logPrefix} ❓ Batch not found rejection confirmed`);
      console.table(notFoundCase.result);
    }
    
    //------------------------------------------------------------
    // Performance timing
    //------------------------------------------------------------
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('Packaging metadata update test completed', {
      context: 'test-packaging-material-batch-adjust-metadata',
      elapsedSeconds: elapsed
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    
    process.exitCode = 0;
    
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Packaging metadata test failed', {
      context: 'test-packaging-material-batch-adjust-metadata'
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
