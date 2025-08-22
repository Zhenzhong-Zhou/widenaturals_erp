const { pool, getUniqueScalarValue } = require('../../database/db');
const { createOrderService } = require('../../services/order-service');

(async () => {
  const client = await pool.connect();

  try {
    const now = new Date();
    const { rows } = await client.query(
      `
      SELECT id, role_id FROM users WHERE email = $1
    `,
      // ['root@widenaturals.com']
      ['jp@widenaturals.com']
    );
    const user = rows[0];
    const { id, role_id } = user;
    const enrichedUser = {
      id,
      role: role_id,
    };
    const userId = id;

    const order_type_id = await getUniqueScalarValue(
      {
        table: 'order_types',
        where: { code: 'SALES_STD' },
        select: 'id',
      },
      client
    );

    const order_status_id = await getUniqueScalarValue(
      {
        table: 'order_status',
        where: { code: 'ORDER_PENDING' },
        select: 'id',
      },
      client
    );

    const shipping_address_id = await getUniqueScalarValue(
      {
        table: 'addresses',
        where: { full_name: 'John Doe', label: 'Shipping' },
        select: 'id',
      },
      client
    );

    const billing_address_id = await getUniqueScalarValue(
      {
        table: 'addresses',
        where: { full_name: 'John Doe', label: 'Billing' },
        select: 'id',
      },
      client
    );

    const customer_id = await getUniqueScalarValue(
      {
        table: 'customers',
        where: { email: 'john.doe@example.com' },
        select: 'id',
      },
      client
    );

    const payment_method_id = await getUniqueScalarValue(
      {
        table: 'payment_methods',
        where: { code: 'CREDIT_CARD' },
        select: 'id',
      },
      client
    );

    const discount_id = await getUniqueScalarValue(
      {
        table: 'discounts',
        where: { name: 'New Customer Offer' },
        select: 'id',
      },
      client
    );

    const tax_rate_id = await getUniqueScalarValue(
      {
        table: 'tax_rates',
        where: { name: 'PST', province: 'BC' },
        select: 'id',
      },
      client
    );

    const delivery_method_id = await getUniqueScalarValue(
      {
        table: 'delivery_methods',
        where: { method_name: 'Standard Shipping' },
        select: 'id',
      },
      client
    );

    const sku_id_1 = await getUniqueScalarValue(
      {
        table: 'skus',
        where: { sku: 'PG-NM203-R-CA' },
        select: 'id',
      },
      client
    );

    const sku_id_2 = await getUniqueScalarValue(
      {
        table: 'skus',
        where: { sku: 'PG-NM208-R-CN' },
        select: 'id',
      },
      client
    );
    
    const packaging_material_id_1 = await getUniqueScalarValue(
      {
        table: 'packaging_materials',
        where: { name: 'Brand E Paper Bag - Medium (Brown)' },
        select: 'id',
      },
      client
    );

    const orderData = {
      order_type_id,
      order_date: now,
      note: 'Test sales order from service',
      shipping_address_id,
      billing_address_id,
      created_by: userId,
      updated_at: null,
      updated_by: null,
      customer_id,
      payment_method_id,
      currency_code: 'USD',
      exchange_rate: '1.41',
      discount_id,
      tax_rate_id,
      shipping_fee: 5.0,
      delivery_method_id,
      order_items: [
        {
          sku_id: sku_id_1,
          price_id: await getUniqueScalarValue(
            {
              table: 'pricing',
              where: { sku_id: sku_id_1 },
              select: 'id',
            },
            client
          ),
          quantity_ordered: 2,
          price: 20.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku_id_1,
          price_id: await getUniqueScalarValue(
            {
              table: 'pricing',
              where: { sku_id: sku_id_1 },
              select: 'id',
            },
            client
          ),
          quantity_ordered: 2,
          price: 20.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku_id_2,
          price_id: await getUniqueScalarValue(
            {
              table: 'pricing',
              where: { sku_id: sku_id_2 },
              select: 'id',
            },
            client
          ),
          quantity_ordered: 20,
          price: 200.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          packaging_material_id: packaging_material_id_1,
          quantity_ordered: 1,
          price: 0,
          status_id: order_status_id,
          created_by: userId,
        },
      ],
    };

    const result = await createOrderService(orderData, 'sales', enrichedUser);
    console.log('✅ Sales order created successfully:', result);
  } catch (error) {
    console.error('❌ Failed to create order:', error.message);
  } finally {
    client.release();
  }
})();
