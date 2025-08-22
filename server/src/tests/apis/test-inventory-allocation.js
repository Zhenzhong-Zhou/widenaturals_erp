const { pool, getUniqueScalarValue } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { allocateInventoryForOrder } = require('../../services/inventory-allocation-service');

(async () => {
  const client = await pool.connect();
  
  try {
    // Ensure statusMap is ready
    await initStatusCache();
    
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1`,
      ['root@widenaturals.com']
      // ['jp@widenaturals.com']
    );
    const user = rows[0];
    const { id, role_id } = user;
    const enrichedUser = {
      id,
      role: role_id,
    };
    const userId = user.id;
    
    
    const order_status_id = await getUniqueScalarValue(
      {
        table: 'order_status',
        where: { code: 'ORDER_CONFIRMED' },
        select: 'id',
      },
      client
    );
    
    const warehouseId = await getUniqueScalarValue(
      {
        table: 'warehouses',
        where: { name: 'WIDE Naturals Inc.' },
        select: 'id',
      },
      client
    );
    
    const result = await allocateInventoryForOrder(enrichedUser, '9e4fc39d-3507-4e6a-aa4a-d5c5454801ea', {
      strategy: 'fifo',
      warehouseId
    });
    
    console.log(`✅ Status updated. Items affected: `, result);
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
})();
