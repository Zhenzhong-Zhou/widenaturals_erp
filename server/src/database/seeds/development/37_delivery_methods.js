const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  // Skip if already seeded
  const [{ count }] = await knex('delivery_methods').count('id');
  const total = parseInt(count, 10) || 0;
  
  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping delivery_methods seed: ${total} records already exist.`
    );
    return;
  }
  
  console.log(`[${new Date().toISOString()}] [SEED] Starting delivery_methods seeding...`);
  
  // Fetch status IDs
  const statusIds = await fetchDynamicValues(
    knex,
    'status',
    'name',
    ['active', 'inactive', 'discontinued', 'archived'],
    'id'
  );
  
  const getStatusId = (name) => {
    const id = statusIds[name];
    if (!id) throw new Error(`Status "${name}" not found in DB.`);
    return id;
  };
  
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  // Assign status IDs
  const active = getStatusId('active');
  const inactive = getStatusId('inactive');
  const discontinued = getStatusId('discontinued');
  const archived = getStatusId('archived');
  
  const now = knex.fn.now();
  
  // Delivery method definitions
  const deliveryMethods = [
    // Active
    {
      method_name: 'In-Store Pickup',
      is_pickup_location: true,
      description: 'Pickup at store location.',
      estimated_time: '1 day',
      status_id: active,
    },
    {
      method_name: 'Standard Shipping',
      is_pickup_location: false,
      description: 'Delivery in 5–7 business days.',
      estimated_time: '5 days',
      status_id: active,
    },
    {
      method_name: 'Express Shipping',
      is_pickup_location: false,
      description: '2–3 day expedited delivery.',
      estimated_time: '2 days',
      status_id: active,
    },
    {
      method_name: 'Curbside Pickup',
      is_pickup_location: true,
      description: 'Curbside collection zone pickup.',
      estimated_time: null,
      status_id: active,
    },
    {
      method_name: 'Personal Driver Delivery',
      is_pickup_location: false,
      description: 'Same-day local delivery by driver.',
      estimated_time: '2 hours',
      status_id: active,
    },
    
    // Inactive
    {
      method_name: 'Locker Pickup',
      is_pickup_location: true,
      description: 'Self-serve locker retrieval.',
      estimated_time: '1 day',
      status_id: inactive,
    },
    
    // Discontinued
    {
      method_name: 'Drone Delivery',
      is_pickup_location: false,
      description: 'Experimental aerial drone service.',
      estimated_time: '30 mins',
      status_id: discontinued,
    },
    
    // Archived
    {
      method_name: 'Regional Truck Freight',
      is_pickup_location: false,
      description: 'Obsolete regional freight transport.',
      estimated_time: '10 days',
      status_id: archived,
    },
  ];
  
  // Format insert payload
  const rows = deliveryMethods.map((dm) => ({
    id: knex.raw('uuid_generate_v4()'),
    method_name: dm.method_name,
    is_pickup_location: dm.is_pickup_location,
    description: dm.description,
    estimated_time: dm.estimated_time,
    status_id: dm.status_id,
    status_date: now,
    created_at: now,
    updated_at: null,
    created_by: systemActionId,
    updated_by: null,
  }));
  
  const inserted = await knex('delivery_methods')
    .insert(rows)
    .onConflict(['method_name'])
    .ignore();
  
  console.log(
    `Seeded ${inserted.rowCount || deliveryMethods.length} records into 'delivery_methods' table.`
  );
};
