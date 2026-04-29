/**
 * @fileoverview
 * Manual test script for `editProductBatchMetadataService`
 *
 * Tests:
 *   1. Editable batch metadata update
 *   2. Locked batch rejection
 *   3. Permission rejection
 *   4. Partial metadata update
 *   5. Invalid field rejection
 *   6. Empty payload rejection
 *   7. Batch not found
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
} = require('../../utils/logging/system-logger');
const {
  editProductBatchMetadataService,
} = require('../../services/product-batch-service');
const { initStatusCache } = require('../../config/status-cache');
const {
  initBatchActivityTypeCache,
} = require('../../cache/batch-activity-type-cache');
const { runTestCase } = require('../utlis/runTestCase');
const {
  fetchBatchRecord,
  fetchBatchActivityLog,
} = require('../utlis/batches/batch-test-helpers');

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
    // 2. Load test users
    //------------------------------------------------------------

    const { rows: allowedUsers } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    if (!allowedUsers.length) {
      throw new Error('No allowed test user found');
    }

    const allowedUser = {
      id: allowedUsers[0].id,
      role: allowedUsers[0].role_id,
    };

    console.log(`${logPrefix} 👤 Allowed user`, allowedUser);

    const { rows: deniedUsers } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['jp@widenaturals.com']
    );

    if (!deniedUsers.length) {
      throw new Error('No denied test user found');
    }

    const deniedUser = {
      id: deniedUsers[0].id,
      role: deniedUsers[0].role_id,
    };

    console.log(`${logPrefix} 🚫 Denied user`, deniedUser);

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
    // 4. Fetch manufacturer
    //------------------------------------------------------------

    const { rows: manufacturerRows } = await client.query(`
      SELECT id
      FROM manufacturers
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (!manufacturerRows.length) {
      throw new Error('No manufacturer found for test');
    }

    const manufacturerId = manufacturerRows[0].id;

    console.log(`${logPrefix} 🏭 Using manufacturer: ${manufacturerId}`);

    //------------------------------------------------------------
    // 5. Prepare update payload
    //------------------------------------------------------------

    const updates = {
      lot_number: `LOT-PROD-TEST-${Date.now()}`,
      manufacturer_id: manufacturerId,
      manufacture_date: '2026-02-10',
      expiry_date: '2029-02-10',
      initial_quantity: Math.floor(Math.random() * 5000 + 1000),
      notes: `Updated manufacturing record after QA review ${Date.now()}`,
    };

    console.log(`${logPrefix} 📝 Update payload`);
    console.table(updates);

    //------------------------------------------------------------
    // Test Case 1 — Editable batch
    //------------------------------------------------------------

    const editableCase = await runTestCase(
      'Editable product batch metadata update',
      async () => {
        const result = await editProductBatchMetadataService(
          editableBatch.id,
          updates,
          allowedUser
        );

        return {
          batchId: editableBatch.id,
          batchRegistryId: editableBatch.batch_registry_id,
          result,
        };
      }
    );

    //------------------------------------------------------------
    // Test Case 2 — Locked batch rejection
    //------------------------------------------------------------

    const lockedCase = await runTestCase(
      'Locked product batch should reject update',
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
          await editProductBatchMetadataService(
            lockedBatch.id,
            updates,
            allowedUser
          );

          throw new Error('Expected lifecycle rejection');
        } catch (err) {
          return {
            batchId: lockedBatch.id,
            batchRegistryId: lockedBatch.batch_registry_id,
            expectedError: err.message,
          };
        }
      }
    );

    //------------------------------------------------------------
    // Test Case 3 — Permission rejection
    //------------------------------------------------------------

    const permissionCase = await runTestCase(
      'Editable product batch should reject update without permission',
      async () => {
        try {
          await editProductBatchMetadataService(
            editableBatch.id,
            updates,
            deniedUser
          );

          throw new Error('Expected permission rejection');
        } catch (err) {
          return {
            batchId: editableBatch.id,
            batchRegistryId: editableBatch.batch_registry_id,
            expectedError: err.message,
          };
        }
      }
    );

    //------------------------------------------------------------
    // Test Case 4 — Partial metadata update
    //------------------------------------------------------------

    const partialUpdateCase = await runTestCase(
      'Partial metadata update (notes only)',
      async () => {
        const result = await editProductBatchMetadataService(
          editableBatch.id,
          { notes: `Partial update ${Date.now()}` },
          allowedUser
        );

        return {
          batchId: editableBatch.id,
          batchRegistryId: editableBatch.batch_registry_id,
          result,
        };
      }
    );

    //------------------------------------------------------------
    // Test Case 5 — Invalid field rejection
    //------------------------------------------------------------

    const invalidFieldCase = await runTestCase(
      'Invalid field update should reject',
      async () => {
        try {
          await editProductBatchMetadataService(
            editableBatch.id,
            { invalid_field: 'test' },
            allowedUser
          );

          throw new Error('Expected invalid field rejection');
        } catch (err) {
          return {
            batchId: editableBatch.id,
            expectedError: err.message,
          };
        }
      }
    );

    //------------------------------------------------------------
    // Test Case 6 — Empty payload rejection
    //------------------------------------------------------------

    const emptyPayloadCase = await runTestCase(
      'Empty update payload should reject',
      async () => {
        try {
          await editProductBatchMetadataService(
            editableBatch.id,
            {},
            allowedUser
          );

          throw new Error('Expected empty payload rejection');
        } catch (err) {
          return { expectedError: err.message };
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
          await editProductBatchMetadataService(
            '00000000-0000-0000-0000-000000000000',
            updates,
            allowedUser
          );

          throw new Error('Expected not-found rejection');
        } catch (err) {
          return { expectedError: err.message };
        }
      }
    );

    //------------------------------------------------------------
    // Verification
    //------------------------------------------------------------

    if (editableCase.success) {
      console.log(`${logPrefix} 🔎 Verifying batch update`);

      await fetchBatchRecord(client, editableCase.result.batchId);

      console.log(`${logPrefix} 📜 Verifying activity log`);

      await fetchBatchActivityLog(
        client,
        editableCase.result.batchRegistryId,
        'BATCH_METADATA_UPDATED'
      );
    }

    if (lockedCase.success) {
      console.log(`${logPrefix} 🔒 Locked batch rejection confirmed`);
      console.table(lockedCase.result);
    }

    if (permissionCase.success) {
      console.log(`${logPrefix} 🚫 Permission rejection confirmed`);
      console.table(permissionCase.result);
    }

    if (partialUpdateCase.success) {
      console.log(`${logPrefix} ✏️ Partial metadata update confirmed`);
      console.table(partialUpdateCase.result);
    }

    if (invalidFieldCase.success) {
      console.log(`${logPrefix} ⚠️ Invalid field rejection confirmed`);
      console.table(invalidFieldCase.result);
    }

    if (emptyPayloadCase.success) {
      console.log(`${logPrefix} ⚠️ Empty payload rejection confirmed`);
      console.table(emptyPayloadCase.result);
    }

    if (notFoundCase.success) {
      console.log(`${logPrefix} ❓ Batch not found rejection confirmed`);
      console.table(notFoundCase.result);
    }

    //------------------------------------------------------------
    // Performance timing
    //------------------------------------------------------------

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

    logSystemInfo('Metadata update test completed', {
      context: 'test-product-batch-adjust-metadata',
      elapsedSeconds: elapsed,
    });

    console.log(`${logPrefix} ⏱ Completed in ${elapsed}s`);

    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${error.message}`);

    logSystemException(error, 'Metadata update test failed', {
      context: 'test-product-batch-adjust-metadata',
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
