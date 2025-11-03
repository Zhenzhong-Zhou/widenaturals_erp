/**
 * @file test-complete-manual-fulfillment.js
 * @description
 * Standalone script to manually test the `completeManualFulfillmentService`
 * for outbound manual fulfillment workflows (e.g., pickup in store or personal delivery).
 *
 * Steps:
 *  1. Initialize DB and status cache.
 *  2. Fetch test user (root@widenaturals.com).
 *  3. Define a target shipment ID.
 *  4. Execute the service and log structured results.
 */

const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  completeManualFulfillmentService,
} = require('../../services/outbound-fulfillment-service');

(async () => {
  const logPrefix = '[Test: completeManualFulfillmentService]';
  const startTime = performance.now();
  let client;

  try {
    console.log(`${logPrefix} 🚀 Starting manual fulfillment test...`);

    // --- Step 1: Initialize DB and status cache
    client = await pool.connect();
    await initStatusCache();
    console.log(`${logPrefix} ✅ Status cache initialized.`);

    // --- Step 2: Fetch test user (root admin)
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1 LIMIT 1',
      ['root@widenaturals.com']
    );

    if (rows.length === 0) {
      console.error(
        `${logPrefix} ❌ No test user found with email root@widenaturals.com.`
      );
      process.exit(1);
    }

    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, role: roleId };
    console.log(`${logPrefix} 👤 Using test user:`, JSON.stringify(testUser));

    // --- Step 3: Choose test shipment
    const shipmentId = '6bcf29d8-f60e-4521-9b2e-661dd76a93c6'; // TODO: replace with a valid test ID
    console.log(`${logPrefix} 📦 Using test shipmentId: ${shipmentId}`);

    // --- Step 4: Build request payload
    const requestData = {
      shipmentId,
      orderStatus: 'ORDER_DELIVERED', // final state for manual fulfillment
      shipmentStatus: 'SHIPMENT_COMPLETED',
      fulfillmentStatus: 'FULFILLMENT_COMPLETED',
    };

    console.log(`${logPrefix} ⚙️  Request Data:`, requestData);

    // --- Step 5: Execute the service
    console.log(
      `${logPrefix} ▶️ Executing completeManualFulfillmentService...`
    );
    const result = await completeManualFulfillmentService(
      requestData,
      testUser
    );

    // --- Step 6: Output structured results
    console.log(`${logPrefix} ✅ Service completed successfully.\n`);

    console.log(`${logPrefix} 🧾 Result (Full Object):`);
    console.dir(result, { depth: null });

    console.log(`${logPrefix} 🪶 JSON Summary:`);
    console.log(JSON.stringify(result, null, 2));

    // --- Step 7: Timing summary
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ✅ Test completed in ${elapsed}s.`);
  } catch (error) {
    console.error(`${logPrefix} ❌ Error occurred: ${error.message}`);
    console.error(error.stack);

    // Optional: exit code based on known error types
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 Database client released.`);
    await pool.end().catch(() => {}); // graceful pool cleanup
    process.exit();
  }
})();
