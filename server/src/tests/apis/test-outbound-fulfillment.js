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
    const orderId = '939b06e5-0dd1-4ed5-85cf-1aee4642292e';
    const allocationIds = [
      '2edacd88-03c5-4ac2-831f-ccaba25c0ecc',
      '6682815d-362f-41ed-a1f3-bbbcc1bde74f',
      '04f678b9-9dc0-4fc7-82e0-53a82c72ec5b',
      'a5cb163e-9281-4340-8154-0998cc69f793'
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
