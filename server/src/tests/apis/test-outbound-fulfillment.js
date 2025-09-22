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
    const orderId = 'ddf5a3d3-8ad9-44b0-9084-20ddfcafc356';
    const allocationIds = [
      '40c7cf30-c34c-4669-8aa0-1eb8faaca89c',
      '6c4a4e2a-c5fe-4303-ae5c-e79873e477f9',
      'f2056847-91d2-46ee-8cf2-51e29ecadc45',
      '18a33dd0-719b-4f82-9ad1-d90cca075468'
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
