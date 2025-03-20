/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  // Check if there is existing data
  const existingData = await knex('delivery_methods').select('id').first();
  if (existingData) {
    console.log('⚠️ Skipping seeding: `delivery_methods` table already has data.');
    return;
  }
  
  // Fetch `status_id` for active and inactive statuses
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const inactiveStatusId = await fetchDynamicValue(knex, 'status', 'name', 'inactive', 'id');
  const systemActionId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  
  if (!activeStatusId || !inactiveStatusId) {
    throw new Error('❌ Required statuses ("active" and "inactive") not found in `status` table.');
  }
  
  // Define delivery methods seed data
  const deliveryMethods = [
    {
      method_name: 'In-Store Pickup',
      is_pickup_location: true,
      description: 'Order will be prepared and ready for pickup at the store location.',
      estimated_time: '1 day',
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'Standard Shipping',
      is_pickup_location: false,
      description: 'Delivery within 5-7 business days.',
      estimated_time: '5 days',
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'Express Shipping',
      is_pickup_location: false,
      description: 'Delivery within 2-3 business days.',
      estimated_time: '2 days',
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'Overnight Shipping',
      is_pickup_location: false,
      description: 'Next-day delivery service.',
      estimated_time: '1 day',
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'In-Store Pickup',
      is_pickup_location: true,
      description: 'Pickup your order at a store location.',
      estimated_time: null,
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'Curbside Pickup',
      is_pickup_location: true,
      description: 'Pickup at a designated curbside location.',
      estimated_time: null,
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      method_name: 'Freight Shipping',
      is_pickup_location: false,
      description: 'Used for bulk or oversized orders.',
      estimated_time: '7 days',
      status_id: activeStatusId,
      created_by: systemActionId,
      updated_by: null,
    },
  ];
  
  // Insert data into `delivery_methods` with conflict handling
  const insertedRows = await knex('delivery_methods')
    .insert(
      deliveryMethods.map((method) => ({
        id: knex.raw('uuid_generate_v4()'),
        method_name: method.method_name,
        is_pickup_location: method.is_pickup_location,
        description: method.description,
        estimated_time: method.estimated_time,
        status_id: method.status_id,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: method.created_by,
        updated_by: null,
      }))
    )
    .onConflict(['method_name']) // Avoid duplicate entries
    .ignore();
  
  console.log(`✅ Seeded ${insertedRows.rowCount || 0} records into 'delivery_methods' table.`);
};
