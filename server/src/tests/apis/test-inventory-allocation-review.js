const { pool } = require('../../database/db');
const { reviewInventoryAllocationService } = require('../../services/inventory-allocation-service');

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
    const orderId = '5e65fdbb-009b-4299-a374-3bdddd6ec608';
    const allocationIds = [
      'b500748d-d3e5-4a82-b03e-a9801762326c',
      'afc47952-5c90-4765-869b-2426a1322616',
      '5adcc2d6-1ddf-417a-b4d3-1ef9c451aff5',
      '2a7e778c-f2c5-44ec-a7cd-43ef74395da0',
      'bb7c866c-409f-499c-86f1-e5ee8c7801ec'
    ];
    
    // Step 3: Execute service
    const result = await reviewInventoryAllocationService(orderId, allocationIds, enrichedUser);
    
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
