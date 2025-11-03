const { pool } = require('../../database/db');
const {
  insertOrderItemsBulk,
} = require('../../repositories/order-item-repository');
const { initStatusCache } = require('../../config/status-cache');

(async () => {
  const client = await pool.connect();
  await initStatusCache();

  const logContext = '[Test: insertOrderItemsBulk]';
  const now = new Date().toISOString();

  try {
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

    const orderId = '2af78c3a-50fa-42c4-82e3-52a3e8470d9f';
    const skuId = 'f2b296d4-1f78-4175-9ef7-15d6d33af3a5'; // SKU → conflict test
    const packagingId = 'edaed92e-da15-4745-953a-a8120d07445f';
    const priceId = '581a0f96-a705-47be-9d87-ab7f39704289';
    const statusId = 'ea1c1973-ce52-43d7-b318-2f25f69e9a6e';

    const inputOrderItems = [
      {
        sku_id: skuId,
        packaging_material_id: null,
        quantity_ordered: 5,
        price_id: priceId,
        price: 200,
        subtotal: 1000,
        status_id: statusId,
        metadata: JSON.stringify({
          submitted_price: 200,
          db_price: 180,
          reason: 'auto-merge test',
        }),
        created_by: userId,
        updated_by: null,
      },
      {
        sku_id: null,
        packaging_material_id: packagingId,
        quantity_ordered: 10,
        price_id: null,
        price: 25,
        subtotal: 250,
        status_id: statusId,
        metadata: JSON.stringify({
          note: 'non-conflicting row',
        }),
        created_by: userId,
        updated_by: null,
      },
    ];

    const result = await insertOrderItemsBulk(orderId, inputOrderItems, client);

    console.log(`${logContext} Result:\n`, result);
    console.log(
      `${logContext} JSON Preview:\n`,
      JSON.stringify(result, null, 2)
    );

    const { rows: updatedRows } = await client.query(
      `
      SELECT id, sku_id, quantity_ordered, price, subtotal, metadata
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at DESC
      LIMIT 5;
    `,
      [orderId]
    );

    console.log(`${logContext} Updated Rows:\n`, updatedRows);
  } catch (err) {
    console.error(`${logContext} Error:`, err.message);
    console.error(err.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
