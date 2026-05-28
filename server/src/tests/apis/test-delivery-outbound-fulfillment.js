const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const {
  initStatusCache,
  initAllStatusCaches,
} = require('../../config/status-cache');
const {
  markShipmentDeliveredService,
} = require('../../services/outbound-fulfillment-service');

const TEST_USER_EMAIL = 'root@widenaturals.com';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    shipmentIdOverride: args.find((a) => !a.startsWith('--')) ?? null,
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

const findEligibleShipment = async (client) => {
  const eligibleOrderStatuses = ['ORDER_SHIPPED', 'ORDER_PARTIALLY_DELIVERED'];
  
  const { rows } = await client.query(
    `
    SELECT os.id
    FROM outbound_shipments os
    JOIN shipment_status ss  ON os.status_id = ss.id
    JOIN delivery_methods dm ON os.delivery_method_id = dm.id
    JOIN orders o            ON o.id = os.order_id
    JOIN order_status ost    ON ost.id = o.order_status_id
    WHERE ss.code = 'SHIPMENT_IN_TRANSIT'
      AND dm.is_carrier_tracked = true
      AND ost.code = ANY($1::text[])
    ORDER BY os.created_at DESC
    LIMIT 1
    `,
    [eligibleOrderStatuses]
  );
  
  if (!rows.length) {
    throw new Error(
      `No eligible carrier-tracked shipment found ` +
      `(shipment in IN_TRANSIT, order in [${eligibleOrderStatuses.join(', ')}]).`
    );
  }
  return rows[0].id;
};

const assertExpectedShape = (result) => {
  if (!result?.order?.id) throw new Error('Result missing order.id.');
  if (!Array.isArray(result.fulfillments) || !result.fulfillments.length) {
    throw new Error('Result missing fulfillments.');
  }
  if (!Array.isArray(result.shipment) || !result.shipment.length) {
    throw new Error('Result missing shipment.');
  }
};

(async () => {
  const logPrefix = '[Test: markShipmentDeliveredService]';
  const startTime = performance.now();
  let client;
  
  try {
    const { shipmentIdOverride } = parseArgs();
    
    console.log(`${logPrefix} 🚀 Flow: carrier-tracked delivery confirmation`);
    
    client = await pool.connect();
    await initStatusCache();
    await initAllStatusCaches();
    console.log(`${logPrefix} ✅ Status cache initialized.`);
    
    const testUser = await fetchTestUser(client);
    console.log(`${logPrefix} 👤 Test user: ${JSON.stringify(testUser)}`);
    
    const shipmentId =
      shipmentIdOverride ?? (await findEligibleShipment(client));
    console.log(`${logPrefix} 📦 Shipment ID: ${shipmentId}`);
    
    const result = await markShipmentDeliveredService(shipmentId, testUser);
    
    console.log(`${logPrefix} ✅ Service returned:`);
    console.dir(result, { depth: null });
    
    assertExpectedShape(result);
    
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
