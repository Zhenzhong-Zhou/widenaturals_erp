const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { adjustInventoryForFulfillmentService } = require('../../services/outbound-fulfillment-service');

(async () => {
  const client = await pool.connect();
  
  const logContext = '[Test: adjustInventoryForFulfillment]';
  
  try {
    // Ensure statusMap is ready
    await initStatusCache();
    
    // Step 1: Fetch test user
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} ❌ Test user not found.`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, role: roleId };
    
    console.log(`${logContext} ✅ Test user loaded:`, testUser);
    
    // Step 2: Choose test order
    const orderId = '61d418fb-b5bc-454d-ac2d-3ddfe84bea6a'; // adjust as needed
    console.log(`${logContext} Using test orderId: ${orderId}`);
    
    // Step 3: Build requestData for service
    const requestData = {
      orderId,
      orderStatus: 'ORDER_FULFILLED',
      shipmentStatus: 'SHIPMENT_READY',
      fulfillmentStatus: 'FULFILLMENT_PACKED',
    };
    
    // Step 4: Execute service
    console.log(`${logContext} ▶️ Running adjustInventoryForFulfillmentService...`);
    const result = await adjustInventoryForFulfillmentService(requestData, testUser);
    
    // Step 5: Review Results
    console.log(`${logContext} ✅ Service completed successfully.`);
    console.log(`${logContext} Full Result Object:`);
    console.dir(result, { depth: null, colors: true });
    
    console.log(`${logContext} JSON Preview:\n${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.error(`${logContext} ❌ Error:`, error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
