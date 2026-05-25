const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  completeManualFulfillmentService,
} = require('../../services/outbound-fulfillment-service');
const {
  buildCompletionPayload,
  buildInvalidPickupWithTrackings
} = require('../utils/fulfillment-completion-fixtures');

const TEST_USER_EMAIL = 'root@widenaturals.com';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    shipmentIdOverride: args.find((a) => !a.startsWith('--')) ?? null,
    isCarrier: args.includes('--carrier'),
    invalidTracking: args.includes('--invalid-tracking'),
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

const findEligibleShipment = async (client, { isCarrier }) => {
  const eligibleOrderStatuses = ['ORDER_FULFILLED'];
  
  const { rows } = await client.query(
    `
    SELECT os.id
    FROM outbound_shipments os
    JOIN shipment_status ss   ON os.status_id = ss.id
    JOIN delivery_methods dm  ON os.delivery_method_id = dm.id
    JOIN orders o             ON o.id = os.order_id
    JOIN order_status ost     ON ost.id = o.order_status_id
    WHERE ss.code = ANY($1::text[])
      AND dm.is_pickup_location = $2
      AND ss.is_final = false
      AND ost.is_final = false
      AND ost.code = ANY($3::text[])
    ORDER BY os.created_at DESC
    LIMIT 1
    `,
    [['SHIPMENT_PENDING', 'SHIPMENT_READY'], !isCarrier, eligibleOrderStatuses]
  );
  
  if (!rows.length) {
    throw new Error(
      `No eligible ${isCarrier ? 'carrier' : 'pickup'} shipment found ` +
      `(shipment in PENDING/READY, order in [${eligibleOrderStatuses.join(', ')}]).`
    );
  }
  return rows[0].id;
};

const assertExpectedShape = (result, { isCarrier }) => {
  if (!result?.order?.id) throw new Error('Result missing order.id.');
  if (!Array.isArray(result.fulfillments) || !result.fulfillments.length) {
    throw new Error('Result missing fulfillments.');
  }
  if (isCarrier && !(result.trackings?.length > 0)) {
    throw new Error('Carrier flow expected trackings in result.');
  }
  if (!isCarrier && result.trackings?.length) {
    throw new Error('Pickup flow expected no trackings in result.');
  }
};

(async () => {
  const logPrefix = '[Test: completeManualFulfillmentService]';
  const startTime = performance.now();
  let client;
  
  try {
    const { shipmentIdOverride, isCarrier, invalidTracking } = parseArgs();
    
    const flowLabel = invalidTracking
      ? 'pickup + trackings (negative — expect rejection)'
      : isCarrier
        ? 'carrier (with trackings)'
        : 'pickup';
    console.log(`${logPrefix} 🚀 Flow: ${flowLabel}`);
    
    client = await pool.connect();              // ← put back
    await initStatusCache();                    // ← put back
    console.log(`${logPrefix} ✅ Status cache initialized.`);
    
    const testUser = await fetchTestUser(client); // ← put back
    console.log(`${logPrefix} 👤 Test user: ${JSON.stringify(testUser)}`);
    
    const shipmentId =
      shipmentIdOverride ??
      (await findEligibleShipment(client, { isCarrier: isCarrier && !invalidTracking }));
    console.log(`${logPrefix} 📦 Shipment ID: ${shipmentId}`);
    
    const completionData = invalidTracking
      ? buildInvalidPickupWithTrackings()
      : buildCompletionPayload({ isPickup: !isCarrier });
    console.log(`${logPrefix} ⚙️  Completion payload:`);
    console.dir(completionData, { depth: null });
    
    const result = await completeManualFulfillmentService(
      completionData,
      shipmentId,
      testUser
    );
    
    console.log(`${logPrefix} ✅ Service returned:`);
    console.dir(result, { depth: null });
    
    assertExpectedShape(result, { isCarrier });
    
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
