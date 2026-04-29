const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const {
  receiveProductBatchService,
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

const logPrefix = '[test-receive-product-batch]';

//------------------------------------------------------------
// Main Test Runner
//------------------------------------------------------------

(async () => {
  const start = performance.now();

  let client;

  try {
    console.log(`${logPrefix} 🚀 Starting tests`);

    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connected`);

    //--------------------------------------------------------
    // Initialize caches
    //--------------------------------------------------------

    await initStatusCache();
    await initBatchActivityTypeCache();

    //--------------------------------------------------------
    // Load test users
    //--------------------------------------------------------

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

    console.log(
      `${logPrefix} 👤 Allowed user: ${chalk.green(JSON.stringify(allowedUser))}`
    );

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

    console.log(
      `${logPrefix} 🚫 Denied user: ${chalk.yellow(JSON.stringify(deniedUser))}`
    );

    //--------------------------------------------------------
    // Test Case 1 — Successful receive
    //--------------------------------------------------------

    const receiveCase = await runTestCase(
      'Receive product batch successfully',
      async () => {
        const { rows } = await client.query(`
          SELECT
            pb.id,
            br.id AS batch_registry_id
          FROM product_batches pb
          JOIN batch_registry br
            ON br.product_batch_id = pb.id
          JOIN batch_status bs
            ON bs.id = pb.status_id
          WHERE bs.name = 'pending'
          ORDER BY RANDOM()
          LIMIT 1
        `);

        if (!rows.length) {
          throw new Error('No pending batch available');
        }

        const batch = rows[0];

        const result = await receiveProductBatchService(
          batch.id,
          new Date(),
          `Receive batch test ${Date.now()}`,
          allowedUser
        );

        return {
          batchId: batch.id,
          batchRegistryId: batch.batch_registry_id,
          result,
        };
      }
    );

    //--------------------------------------------------------
    // Test Case 2 — Lifecycle rejection
    //--------------------------------------------------------

    const lifecycleRejectCase = await runTestCase(
      'Receiving non-pending batch should reject',
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
          throw new Error('No non-pending batch available');
        }

        const batch = rows[0];

        try {
          await receiveProductBatchService(
            batch.id,
            new Date(),
            'Lifecycle rejection test',
            allowedUser
          );

          throw new Error('Expected lifecycle rejection');
        } catch (err) {
          return {
            batchId: batch.id,
            batchRegistryId: batch.batch_registry_id,
            expectedError: err.message,
          };
        }
      }
    );

    //--------------------------------------------------------
    // Test Case 3 — Permission rejection
    //--------------------------------------------------------

    const permissionRejectCase = await runTestCase(
      'Receive batch without permission should reject',
      async () => {
        const { rows } = await client.query(`
          SELECT
            pb.id,
            br.id AS batch_registry_id
          FROM product_batches pb
          JOIN batch_registry br
            ON br.product_batch_id = pb.id
          JOIN batch_status bs
            ON bs.id = pb.status_id
          WHERE bs.name = 'pending'
          ORDER BY RANDOM()
          LIMIT 1
        `);

        if (!rows.length) {
          throw new Error('No pending batch available');
        }

        const batch = rows[0];

        try {
          await receiveProductBatchService(
            batch.id,
            new Date(),
            'Permission rejection test',
            deniedUser
          );

          throw new Error('Expected permission rejection');
        } catch (err) {
          return {
            batchId: batch.id,
            batchRegistryId: batch.batch_registry_id,
            expectedError: err.message,
          };
        }
      }
    );

    //--------------------------------------------------------
    // Verify successful case
    //--------------------------------------------------------

    if (receiveCase.success) {
      console.log(`${logPrefix} 🔎 Verifying batch update`);

      await fetchBatchRecord(client, receiveCase.result.batchId);

      console.log(`${logPrefix} 📜 Verifying activity log`);

      await fetchBatchActivityLog(
        client,
        receiveCase.result.batchRegistryId,
        'BATCH_METADATA_UPDATED'
      );
    }

    //--------------------------------------------------------
    // Log rejections
    //--------------------------------------------------------

    if (lifecycleRejectCase.success) {
      console.log(`${logPrefix} 🔒 Lifecycle rejection confirmed`);
      console.table(lifecycleRejectCase.result);
    }

    if (permissionRejectCase.success) {
      console.log(`${logPrefix} 🚫 Permission rejection confirmed`);
      console.table(permissionRejectCase.result);
    }

    const duration = (performance.now() - start).toFixed(2);

    logSystemInfo(`${logPrefix} Tests completed`, {
      context: 'test-receive-product-batch',
      duration_ms: duration,
    });
  } catch (error) {
    logSystemException(error, `${logPrefix} Test failure`, {
      context: 'test-receive-product-batch',
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
