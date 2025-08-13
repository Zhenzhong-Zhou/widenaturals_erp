const { pool } = require('../../database/db');
const { getSkuLookup } = require('../../repositories/sku-repository');
const { getOrderDetailsByIdService } = require('../../services/order-service');

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
    // const orderId = await getOrderDetailsByIdService();
    const orderId = '9ddf4ab6-3470-4971-8b85-3f529e4e0323';
    
    const serviceResult = await getOrderDetailsByIdService(orderId);
    console.log('SKU lookup service result:', serviceResult);
  } catch (error) {
    console.error('Failed to fetch discount lookup:', error.message);
  } finally {
    client.release();
  }
})();
