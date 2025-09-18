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
    const orderId = '57b58eb6-90c2-4e44-a5ae-7fc87d0a50be';
    const allocationIds = [
      'dc5a4086-a133-4e1b-82dc-5c51f2b5099e',
      '1363f7db-264c-4898-803c-f73b7fbf6049',
      '0e4d6640-c9fe-4eca-a937-32daa5cf0e93',
      '281a6bcf-6bb1-4820-a9ba-922b5cc984e7'
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
