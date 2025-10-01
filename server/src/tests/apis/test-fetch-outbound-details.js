const { pool } = require('../../database/db');
const { getShipmentDetailsService } = require('../../services/outbound-fulfillment-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: ShipmentDetails]';
  const startTime = Date.now();
  const shipmentId = '844f3d53-a102-46aa-8644-90b3a3b35fd7';
  
  try {
    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} ❌ Test user not found for email root@widenaturals.com`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, roleId };
    console.log(`${logContext} ✅ Test user loaded:`, testUser);
    
    // Step 2: Run shipment details service
    console.log(`${logContext} ▶️ Running getShipmentDetailsService for shipmentId=${shipmentId}...`);
    const result = await getShipmentDetailsService(shipmentId);
    
    if (!result) {
      console.warn(`${logContext} ⚠️ No shipment details found for shipmentId=${shipmentId}`);
    } else {
      console.log(`${logContext} ✅ Service completed successfully in ${Date.now() - startTime}ms`);
      console.log(`${logContext} ▶️ Shipment Header:`, result.shipment);
      console.log(`${logContext} ▶️ Fulfillments Count:`, result.fulfillments?.length || 0);
      if (result.fulfillments?.[0]) {
        console.log(`${logContext} ▶️ First Fulfillment Preview:`, result.fulfillments[0]);
      }
      console.log(`${logContext} ▶️ Full JSON:\n${JSON.stringify(result, null, 2)}`);
    }
  } catch (error) {
    console.error(`${logContext} ❌ Error fetching shipment details for shipmentId=${shipmentId}`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    // Graceful shutdown
    setTimeout(() => {
      pool.end(); // close pool cleanly
      process.exit(0);
    }, 200);
  }
})();
