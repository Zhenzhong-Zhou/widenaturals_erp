/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  // Fetch `active` status ID if statuses exist in another table
  const activeStatusRow = await knex('status')
    .select('id')
    .where('name', 'active')
    .first();
  const activeStatusId = activeStatusRow?.id ?? knex.raw('uuid_generate_v4()'); // Fallback in case no status exists

  // Fetch system user ID for tracking
  const systemUserRow = await knex('users')
    .select('id')
    .where('email', 'system@internal.local')
    .first();
  const systemActionId = systemUserRow?.id ?? knex.raw('uuid_generate_v4()'); // Fallback to avoid NULL issues

  // Define order statuses
  const orderStatuses = [
    // 🔄 **Processing**
    {
      name: 'Pending',
      category: 'processing',
      code: 'ORDER_PENDING',
      description: 'Order received but not yet processed.',
    },
    {
      name: 'Processing',
      category: 'processing',
      code: 'ORDER_PROCESSING',
      description: 'Order is being prepared.',
    },

    // 💳 **Payment**
    {
      name: 'Awaiting Payment',
      category: 'payment',
      code: 'PAYMENT_PENDING',
      description: 'Waiting for customer payment.',
    },
    {
      name: 'Paid',
      category: 'payment',
      code: 'PAYMENT_COMPLETED',
      description: 'Payment received.',
    },

    // 🚚 **Shipment**
    {
      name: 'Shipped',
      category: 'shipment',
      code: 'ORDER_SHIPPED',
      description: 'Order has been shipped to the customer.',
    },
    {
      name: 'Out for Delivery',
      category: 'shipment',
      code: 'ORDER_OUT_FOR_DELIVERY',
      description: 'Order is out for delivery.',
    },
    {
      name: 'Delivered',
      category: 'completion',
      code: 'ORDER_DELIVERED',
      description: 'Order successfully delivered.',
      is_final: true,
    },

    // 🔄 **Returns**
    {
      name: 'Return Requested',
      category: 'return',
      code: 'RETURN_REQUESTED',
      description: 'Customer has requested a return.',
    },
    {
      name: 'Returned',
      category: 'return',
      code: 'RETURN_COMPLETED',
      description: 'Order has been returned.',
      is_final: true,
    },

    // ❌ **Cancellations**
    {
      name: 'Canceled',
      category: 'completion',
      code: 'ORDER_CANCELED',
      description: 'Order was canceled.',
      is_final: true,
    },
  ];

  // Insert data with ON CONFLICT to avoid duplicates
  for (const status of orderStatuses) {
    await knex('order_status')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        ...status,
        status_id: activeStatusId, // Ensuring a valid status reference
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(), // Ensuring consistency
        created_by: systemActionId, // Ensuring valid user tracking
        updated_by: systemActionId, // If updated, log the user
      })
      .onConflict(['name', 'code']) // Ensure uniqueness
      .ignore();
  }

  console.log(`${orderStatuses.length} order statuses seeded successfully.`);
};
