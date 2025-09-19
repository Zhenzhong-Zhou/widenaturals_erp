const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { fulfillOutboundShipmentService } = require('../../services/outbound-fulfillment-service');

(async () => {
  const client = await pool.connect();
  
  try {
    // Ensure statusMap is ready
    await initStatusCache();
    
    const logContext = '[Test: outboundFulfillment]';
    
    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} User not found.`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    const enrichedUser = { id: userId, role: roleId };
    
    // Step 2: Set test params
    const orderId = 'fce1a218-a855-4d15-97fa-8074b30526e6';
    const allocationIds = [
      'cd3aa66f-1d7f-46c3-aed1-d466476f58ed',
      '0cc2ef0c-9ea9-4d5b-a2c6-3c877c6dfa70',
      '00e78a1d-2469-40f2-866d-58595454bc73',
      '045d8e68-e9ae-41a5-ba99-f86deda3aaac'
    ];
    
    // Step 3: Build requestData
    const requestData = {
      orderId,
      allocations: { ids: allocationIds },
      fulfillmentNotes: 'Auto test fulfillment notes',
      shipmentNotes: 'Auto test shipment notes',
      shipmentBatchNote: 'Auto test shipment batch notes',
    };

    // Step 4: Execute service
    const result = await fulfillOutboundShipmentService(requestData, enrichedUser);
    
    console.log(`${logContext} Review Result:`);
    console.dir(result, { depth: null, colors: true });
    
    console.log(`${logContext} JSON Preview:\n`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[Test: reviewInventoryAllocation] Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
