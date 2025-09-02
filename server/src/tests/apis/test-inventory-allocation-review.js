const { pool } = require('../../database/db');
const { reviewInventoryAllocation } = require('../../services/inventory-allocation-service');

(async () => {
  const client = await pool.connect();
  
  try {
    const logContext = '[Test: reviewInventoryAllocation]';
    
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
    const orderId = '39f87f60-6605-449b-bc03-94660a18b096';
    const allocationIds = [
      'cca00f30-265c-42e3-bcf4-5099d236d43a',
      '7117e327-6a39-4d79-a027-cfffd5aec9ca',
      '7326574d-f962-461a-9381-be86f5786da0',
      '74dee76c-8130-4c8c-bbdd-0f174485c89a',
    ];
    
    // Step 3: Execute service
    const result = await reviewInventoryAllocation(orderId, allocationIds, enrichedUser);
    
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
