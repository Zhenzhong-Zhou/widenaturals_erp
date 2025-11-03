const { pool } = require('../../database/db');
const {
  reviewInventoryAllocationService,
} = require('../../services/inventory-allocation-service');

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
    const orderId = '306e2c8a-5494-408d-a4fd-c5b1687ddcc9';
    const warehouseIds = ['78f379f5-42a9-4202-a5dc-387bda7f9afd'];
    const allocationIds = [
      'cbcb4bf9-40b7-4029-86d4-5cd3c9f515ee',
      '13fec63d-055e-4166-95a5-529b39f2f827',
      '76beedf5-748a-47a3-a36c-60ab9ac99be0',
    ];

    // Step 3: Execute service
    const result = await reviewInventoryAllocationService(
      orderId,
      allocationIds,
      warehouseIds
    );

    console.log(`${logContext} Review Result:`);
    console.dir(result, { depth: null, colors: true });

    console.log(
      `${logContext} JSON Preview:\n`,
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    console.error('[Test: reviewInventoryAllocation] Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
