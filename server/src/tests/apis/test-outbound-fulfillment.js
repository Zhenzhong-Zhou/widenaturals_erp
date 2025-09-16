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
    const orderId = 'c92c6912-6b00-40c6-b37a-2b503744eda8';
    const allocationIds = [
      'a765012a-461f-44a1-aa63-e98d678ac61c',
      'b1938b93-0f4d-4a6b-a1d1-f9a0d5e37723',
      'aee87011-af5c-417e-9c76-14aaa4680f77',
      '9d0591ac-7aee-4693-803b-d83180679525'
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
