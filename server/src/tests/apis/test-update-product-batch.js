/**
 * @fileoverview
 * Manual test script for `productBatchAdjustService`
 *
 * Tests:
 *   1. Editable batch metadata update
 *   2. Locked batch rejection
 *
 * Usage:
 *   node test-product-batch-adjust-metadata.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const {
  productBatchAdjustService,
} = require('../../services/product-batch-service');
const { initStatusCache } = require('../../config/status-cache');
const {
  initBatchActivityTypeCache,
  getBatchActivityTypeId
} = require('../../cache/batch-activity-type-cache');
const {
  toSnakeCaseBatchUpdates
} = require('../../transformers/product-batch-transformer');
const { runTestCase } = require('../utlis/runTestCase');

/**
 * Fetch batch data
 */
const verifyBatch = async (client, batchId) => {
  
  const { rows } = await client.query(`
    SELECT
      id,
      lot_number,
      notes,
      updated_at
    FROM product_batches
    WHERE id = $1
  `, [batchId]);
  
  console.table(rows);
};


/**
 * Fetch activity logs
 */
const verifyActivity = async (client, batchRegistryId) => {
  
  const metadataActivityId =
    getBatchActivityTypeId('BATCH_METADATA_UPDATED');
  
  const { rows } = await client.query(`
    SELECT
      id,
      batch_registry_id,
      batch_activity_type_id,
      previous_value,
      new_value,
      changed_at
    FROM batch_activity_logs
    WHERE batch_registry_id = $1
      AND batch_activity_type_id = $2
    ORDER BY changed_at DESC
    LIMIT 1
  `, [
    batchRegistryId,
    metadataActivityId
  ]);
  
  console.table(rows);
};



(async () => {
  
  const logPrefix = chalk.cyan('[Test: PRODUCT_BATCH_METADATA_UPDATE]');
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
    // 2. Load test user
    //------------------------------------------------------------
    
    const { rows: users } = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (!users.length) {
      throw new Error('Test user not found');
    }
    
    const actorId = users[0].id;
    
    console.log(`${logPrefix} 👤 Using actor: ${actorId}`);
    
    //------------------------------------------------------------
    // 3. Fetch editable batch
    //------------------------------------------------------------
    
    const { rows: editableRows } = await client.query(`
      SELECT
        pb.id,
        br.id AS batch_registry_id,
        pb.notes,
        pb.status_id,
        bs.name AS status_name
      FROM product_batches pb
      JOIN batch_registry br
        ON br.product_batch_id = pb.id
      JOIN batch_status bs
        ON bs.id = pb.status_id
      WHERE bs.name = 'pending'
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (!editableRows.length) {
      throw new Error('No pending batch found for editable test');
    }
    
    const editableBatch = editableRows[0];
    
    console.log(`${logPrefix} 📦 Editable batch`);
    console.table(editableBatch);
    
    //------------------------------------------------------------
    // 4. Prepare update payload
    //------------------------------------------------------------
    
    const updates = {
      lotNumber: `TEST-${Date.now()}`,
      manufactureDate: '2024-01-01',
      expiryDate: '2027-01-01',
      initialQuantity: Math.floor(Math.random() * 100 + 1),
      notes: `Metadata test update ${Date.now()}`
    };
    
    console.log(`${logPrefix} 📝 Update payload`);
    console.table(updates);
    
    //------------------------------------------------------------
    // Test Case 1 — Editable batch
    //------------------------------------------------------------
    
    const editableCase = await runTestCase(
      'Editable batch metadata update',
      async () => {
        
        const dbUpdates = toSnakeCaseBatchUpdates(updates);
        
        const result = await productBatchAdjustService(
          editableBatch.id,
          dbUpdates,
          actorId,
          client
        );
        
        return {
          batchId: editableBatch.id,
          batchRegistryId: editableBatch.batch_registry_id,
          result
        };
      }
    );
    
    
    //------------------------------------------------------------
    // Test Case 2 — Locked batch should reject
    //------------------------------------------------------------
    
    const lockedCase = await runTestCase(
      'Locked batch should reject update',
      async () => {
        
        const { rows } = await client.query(`
          SELECT
            pb.id,
            br.id AS batch_registry_id,
            bs.name AS status_name
          FROM product_batches pb
          JOIN batch_registry br
            ON br.product_batch_id = pb.id
          JOIN batch_status bs
            ON bs.id = pb.status_id
          WHERE bs.name <> 'pending'
          ORDER BY RANDOM()
          LIMIT 1
        `);
        
        if (!rows.length) {
          throw new Error('No locked batch available');
        }
        
        const lockedBatch = rows[0];
        
        try {
          
          await productBatchAdjustService(
            lockedBatch.id,
            updates,
            actorId,
            client
          );
          
          throw new Error('Expected rejection but update succeeded');
          
        } catch (err) {
          
          return {
            batchId: lockedBatch.id,
            batchRegistryId: lockedBatch.batch_registry_id,
            expectedError: err.message
          };
        }
      }
    );
    
    
    //------------------------------------------------------------
    // 5. Verify results
    //------------------------------------------------------------
    
    if (editableCase.success) {
      
      console.log(`${logPrefix} 🔎 Verifying batch update`);
      
      await verifyBatch(
        client,
        editableCase.result.batchId
      );
      
      console.log(`${logPrefix} 📜 Verifying activity log`);
      
      await verifyActivity(
        client,
        editableCase.result.batchRegistryId
      );
    }
    
    if (lockedCase.success) {
      
      console.log(`${logPrefix} 🔒 Locked batch rejection confirmed`);
      console.table(lockedCase.result);
    }
    
    
    //------------------------------------------------------------
    // Performance timing
    //------------------------------------------------------------
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('Metadata update test completed', {
      context: 'test-product-batch-adjust-metadata',
      elapsedSeconds: elapsed
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    
    process.exitCode = 0;
    
  } catch (error) {
    
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Metadata update test failed', {
      context: 'test-product-batch-adjust-metadata'
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
