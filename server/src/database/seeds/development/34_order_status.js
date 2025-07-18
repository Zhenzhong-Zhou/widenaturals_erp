/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding order_status...');
  
  const existing = await knex('order_status').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Order statuses already seeded. Skipping.');
    return;
  }
  
  // Fetch `active` status ID if statuses exist in another table
  const activeStatusRow = await knex('status')
    .select('id')
    .where('name', 'active')
    .first();
  
  if (!activeStatusRow?.id) {
    throw new Error("Missing 'active' status in status table");
  }
  
  const activeStatusId = activeStatusRow.id;

  // Fetch system user ID for tracking
  const systemUserRow = await knex('users')
    .select('id')
    .where('email', 'system@internal.local')
    .first();
  
  if (!systemUserRow?.id) {
    throw new Error("Missing system user in users table");
  }
  
  const systemActionId = systemUserRow.id;

  // Define order statuses
  const orderStatuses = [
    // DRAFT
    { name: 'Pending', code: 'ORDER_PENDING', category: 'draft', description: 'Order created but not reviewed.' },
    { name: 'Edited', code: 'ORDER_EDITED', category: 'draft', description: 'Order edited before confirmation.' },
    
    // CONFIRMATION
    { name: 'Awaiting Review', code: 'ORDER_AWAITING_REVIEW', category: 'confirmation', description: 'Order is pending approval from a reviewer.', },
    { name: 'Confirmed', code: 'ORDER_CONFIRMED', category: 'confirmation', description: 'Order confirmed for processing.' },
    
    // PROCESSING (covers allocation + fulfillment + shipping)
    { name: 'Allocating', code: 'ORDER_ALLOCATING', category: 'processing', description: 'Attempting to allocate inventory.' },
    { name: 'Partially Allocated', code: 'ORDER_PARTIALLY_ALLOCATED', category: 'processing', description: 'Partial allocation.' },
    { name: 'Fully Allocated', code: 'ORDER_ALLOCATED', category: 'processing', description: 'Fully allocated.' },
    { name: 'Backordered', code: 'ORDER_BACKORDERED', category: 'processing', description: 'Inventory unavailable.' },
    { name: 'Processing', code: 'ORDER_PROCESSING', category: 'processing', description: 'Picking and packing.' },
    { name: 'Partially Fulfilled', code: 'ORDER_PARTIALLY_FULFILLED', category: 'processing', description: 'Partial fulfillment.' },
    { name: 'Shipped', code: 'ORDER_SHIPPED', category: 'processing', description: 'Shipped to customer.' },
    { name: 'Out for Delivery', code: 'ORDER_OUT_FOR_DELIVERY', category: 'processing', description: 'Out for delivery.' },
    
    // COMPLETION
    { name: 'Fulfilled', code: 'ORDER_FULFILLED', category: 'completion', description: 'All items picked and packed.', is_final: false },
    { name: 'Delivered', code: 'ORDER_DELIVERED', category: 'completion', description: 'Successfully delivered.', is_final: true },
    { name: 'Canceled', code: 'ORDER_CANCELED', category: 'completion', description: 'Order canceled.', is_final: true },
    
    // RETURN
    { name: 'Return Requested', code: 'RETURN_REQUESTED', category: 'return', description: 'Customer requested a return.' },
    { name: 'Returned', code: 'RETURN_COMPLETED', category: 'return', description: 'Return completed.', is_final: true },
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
