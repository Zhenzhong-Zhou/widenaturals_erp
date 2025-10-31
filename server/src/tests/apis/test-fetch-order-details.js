const { pool } = require('../../database/db');
const { fetchOrderDetailsByIdService } = require('../../services/order-service');

(async () => {
  const client = await pool.connect();
  
  const { rows } = await client.query(
    `
      SELECT id, role_id FROM users WHERE email = $1
    `,
    ['root@widenaturals.com']
  );
  const user = rows[0];
  const { id, role_id } = user;
  const enrichedUser = {
    id,
    role: role_id,
  };
  
  try {
    const orderId = '12daa236-8d56-484a-9888-35fe1a6a7ece';
    
    const serviceResult = await fetchOrderDetailsByIdService('sales', orderId, enrichedUser);
    console.log('SKU lookup service result:', serviceResult);
  } catch (error) {
    console.error('Failed to fetch discount lookup:', error.message);
  } finally {
    client.release();
  }
})();
