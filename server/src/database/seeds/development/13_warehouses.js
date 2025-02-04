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
  
  // Fetch warehouse-type location IDs
  const warehouseLocationTypeId = await fetchDynamicValue(knex, 'location_types', 'code', 'WAREHOUSE', 'id');
  const warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id');
  
  if (!warehouseLocations.length) {
    console.error('No warehouse locations found. Ensure locations of type "WAREHOUSE" exist.');
    return;
  }
  
  // Define warehouse names and capacities
  const warehouseData = [
    { name: 'Central Warehouse', storage_capacity: 10000 },
    { name: 'Eastside Warehouse', storage_capacity: 5000 },
    { name: 'West Logistics Hub', storage_capacity: 8000 },
    { name: 'Downtown Retail Storage', storage_capacity: 2000 },
    { name: 'North Distribution Center', storage_capacity: 12000 },
  ];
  
  // Assign warehouse locations dynamically
  const warehouseEntries = warehouseData.map((warehouse, index) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: warehouse.name,
    location_id: warehouseLocations[index % warehouseLocations.length].id, // Assign location in round-robin style
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
