const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouses...');
  
  // Fetch active status ID
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Fetch available locations
  const locations = await knex('locations').select('id');
  if (!locations.length) {
    console.error('Ensure locations table is seeded first.');
    return;
  }
  
  // Define dummy warehouses
  const warehouses = [
    { name: 'Central Warehouse', location_id: locations[0].id, storage_capacity: 10000 },
    { name: 'Eastside Warehouse', location_id: locations[1]?.id || locations[0].id, storage_capacity: 5000 },
    { name: 'West Logistics Hub', location_id: locations[2]?.id || locations[0].id, storage_capacity: 8000 },
    { name: 'Downtown Retail Storage', location_id: locations[3]?.id || locations[0].id, storage_capacity: 2000 },
    { name: 'North Distribution Center', location_id: locations[4]?.id || locations[0].id, storage_capacity: 12000 },
  ];
  
  // Insert into warehouses table
  const warehouseEntries = warehouses.map(warehouse => ({
    id: knex.raw('uuid_generate_v4()'),
    name: warehouse.name,
    location_id: warehouse.location_id,
    storage_capacity: warehouse.storage_capacity,
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
    created_by: adminUserId,
    updated_by: adminUserId,
  }));
  
  await knex('warehouses').insert(warehouseEntries);
  
  console.log(`${warehouseEntries.length} warehouses seeded successfully.`);
};
