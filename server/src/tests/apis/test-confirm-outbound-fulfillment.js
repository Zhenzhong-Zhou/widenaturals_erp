const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { initStatusCache, initAllStatusCaches } = require('../../config/status-cache');
const {
  confirmOutboundFulfillmentService,
} = require('../../services/outbound-fulfillment-service');

const TEST_USER_EMAIL = 'root@widenaturals.com';
const BOGUS_UUID = '00000000-0000-0000-0000-000000000000';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    orderIdOverride: args.find((a) => !a.startsWith('--')) ?? null,
    idempotency: args.includes('--idempotency'),
    nonexistent: args.includes('--nonexistent'),
  };
};

const fetchTestUser = async (client) => {
  const { rows } = await client.query(
    'SELECT id, role_id FROM users WHERE email = $1 LIMIT 1',
    [TEST_USER_EMAIL]
  );
  if (!rows.length) {
    throw new Error(`No test user found for email ${TEST_USER_EMAIL}.`);
  }
  return { id: rows[0].id, role: rows[0].role_id };
};

// An order is confirm-eligible when it's in the pre-confirm state and has
// active (non-final) fulfillments and exactly one active shipment.
const findEligibleOrder = async (client) => {
  const eligibleOrderStatuses = [
    'ORDER_PROCESSING',          // after fulfill, before first confirm
    'ORDER_PARTIALLY_FULFILLED', // multi-shipment, after at least one confirm
  ];
  const finalFulfillmentStatuses = ['FULFILLMENT_DELIVERED', 'FULFILLMENT_CANCELLED'];
  
  const { rows } = await client.query(
    `
    SELECT o.id
    FROM orders o
    JOIN order_status ost ON ost.id = o.order_status_id
    WHERE ost.code = ANY($1::text[])
      AND ost.is_final = false
      AND EXISTS (
        SELECT 1
        FROM order_fulfillments f
        JOIN order_items oi        ON oi.id = f.order_item_id
        JOIN fulfillment_status fs ON fs.id = f.status_id
        WHERE oi.order_id = o.id
          AND fs.code <> ALL($2::text[])
      )
      AND EXISTS (
        SELECT 1
        FROM outbound_shipments s
        JOIN shipment_status ss ON ss.id = s.status_id
        WHERE s.order_id = o.id
          AND ss.is_final = false
      )
    ORDER BY o.created_at DESC
    LIMIT 1
  `,
    [eligibleOrderStatuses, finalFulfillmentStatuses]
  );
  
  if (!rows.length) {
    throw new Error(
      `No eligible order found ` +
      `(order in [${eligibleOrderStatuses.join(', ')}], ` +
      `with active fulfillments + shipment).`
    );
  }
  return rows[0].id;
};

const assertExpectedShape = (result) => {
  if (!result?.order?.id) throw new Error('Result missing order.id.');
  if (!result?.shipment?.id) throw new Error('Result missing shipment.id.');
  if (!Array.isArray(result.fulfillments) || !result.fulfillments.length) {
    throw new Error('Result missing fulfillments.');
  }
  if (
    !Array.isArray(result.inventory?.updatedWarehouseIds) ||
    !result.inventory.updatedWarehouseIds.length
  ) {
    throw new Error('Result missing inventory.updatedWarehouseIds.');
  }
  if (!result.statuses?.order) {
    throw new Error('Result missing statuses.order.');
  }
  if (!Array.isArray(result.logs) || !result.logs.length) {
    throw new Error('Result missing inventory activity logs.');
  }
};

(async () => {
  const logPrefix = '[Test: confirmOutboundFulfillmentService]';
  const startTime = performance.now();
  let client;
  
  try {
    const { orderIdOverride, idempotency, nonexistent } = parseArgs();
    
    const flowLabel = nonexistent
      ? 'nonexistent order (negative — expect 404)'
      : idempotency
        ? 'idempotency (confirm twice — second call expects rejection)'
        : 'happy path';
    console.log(`${logPrefix} 🚀 Flow: ${flowLabel}`);
    
    client = await pool.connect();
    await initStatusCache();
    await initAllStatusCaches();
    console.log(`${logPrefix} ✅ Status cache initialized.`);
    
    const testUser = await fetchTestUser(client);
    console.log(`${logPrefix} 👤 Test user: ${JSON.stringify(testUser)}`);
    
    // Negative path: bogus UUID, expect 404
    if (nonexistent) {
      console.log(`${logPrefix} 📋 Order ID: ${BOGUS_UUID}`);
      try {
        await confirmOutboundFulfillmentService(BOGUS_UUID, testUser);
        throw new Error('Service accepted a nonexistent order — gate has a hole.');
      } catch (err) {
        if (err.message.includes('gate has a hole')) throw err;
        console.log(`${logPrefix} ✅ Rejected as expected: ${err.message}`);
      }
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`${logPrefix} ✅ Passed in ${elapsed}s.`);
      return;
    }
    
    // Happy path (and base for idempotency)
    const orderId =
      orderIdOverride ?? (await findEligibleOrder(client));
    console.log(`${logPrefix} 📋 Order ID: ${orderId}`);
    
    const result = await confirmOutboundFulfillmentService(orderId, testUser);
    console.log(`${logPrefix} ✅ Service returned:`);
    console.dir(result, { depth: null });
    assertExpectedShape(result);
    
    // Idempotency: a second confirm on the same order should fail validation
    if (idempotency) {
      console.log(`${logPrefix} 🔁 Re-confirming same order...`);
      try {
        await confirmOutboundFulfillmentService(orderId, testUser);
        throw new Error('Re-confirm succeeded — validation gate has a hole.');
      } catch (err) {
        if (err.message.includes('gate has a hole')) throw err;
        console.log(`${logPrefix} ✅ Re-confirm rejected as expected: ${err.message}`);
      }
    }
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ✅ Passed in ${elapsed}s.`);
  } catch (error) {
    console.error(`${logPrefix} ❌ ${error.message}`);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
  }
})();
