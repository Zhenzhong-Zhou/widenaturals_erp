const { pool, getUniqueScalarValue } = require('../../database/db');
const { updateOrderStatusService } = require('../../services/order-service');

(async () => {
  const client = await pool.connect();

  try {
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

    const order_id = await getUniqueScalarValue(
      {
        table: 'orders',
        where: { order_number: 'SO-SSO-20250820022315-8071ad1b-89cebb600d' },
        select: 'id',
      },
      client
    );

    const order_status_id = await getUniqueScalarValue(
      {
        table: 'order_status',
        where: { code: 'ORDER_CONFIRMED' },
        select: 'id',
      },
      client
    );

    const category = 'sales'; // or 'purchase', 'manufacturing', etc.

    // const result = await updateOrderStatusService(enrichedUser, category, order_id, 'ORDER_CONFIRMED');
    const result = await updateOrderStatusService(
      enrichedUser,
      category,
      order_id,
      'ORDER_AWAITING_REVIEW'
    );
    // const result = await updateOrderStatusService(enrichedUser, category, order_id, 'ORDER_CANCELED');

    console.log(
      `✅ Status updated. Items affected: ${result.enrichedItems.length}`,
      result
    );
  } catch (err) {
    console.error('❌ Update failed:', err.message);
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
})();
