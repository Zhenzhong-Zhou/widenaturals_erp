const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouses...');
  
  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Fetch warehouse location type ID
  const warehouseLocationTypeId = await fetchDynamicValue(knex, 'location_types', 'code', 'WAREHOUSE', 'id');
  
  // Fetch existing warehouse locations
  let warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id');
  
  // Define warehouse names and capacities
  const warehouseData = [
    { name: 'Central Warehouse', storage_capacity: 10000 },
    { name: 'Eastside Warehouse', storage_capacity: 5000 },
    { name: 'West Logistics Hub', storage_capacity: 8000 },
    { name: 'Downtown Retail Storage', storage_capacity: 2000 },
    { name: 'North Distribution Center', storage_capacity: 12000 },
  ];
  
  // If not enough warehouse locations exist, create new ones
  while (warehouseLocations.length < warehouseData.length) {
    const [newLocation] = await knex('locations')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        location_type_id: warehouseLocationTypeId,
        name: `Warehouse Location ${warehouseLocations.length + 1}`,
        address: `Address for Warehouse Location ${warehouseLocations.length + 1}`,
        status_id: activeStatusId,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .returning('id');
    
    warehouseLocations.push(newLocation);
  }
  
  // Assign warehouse locations dynamically (Ensuring each warehouse has a unique location)
  const warehouseEntries = warehouseData.map((warehouse, index) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: warehouse.name,
    location_id: warehouseLocations[index].id,
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
