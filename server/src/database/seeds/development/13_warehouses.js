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
    .select('id', 'name');
  
  // Define warehouse names and capacities
  const warehouseData = [
    { name: 'Central Warehouse', storage_capacity: 10000 },
    { name: 'Eastside Warehouse', storage_capacity: 5000 },
    { name: 'West Logistics Hub', storage_capacity: 8000 },
    { name: 'Downtown Retail Storage', storage_capacity: 2000 },
    { name: 'North Distribution Center', storage_capacity: 12000 },
  ];
  
  // Check and insert missing locations
  for (const warehouse of warehouseData) {
    const existingLocation = warehouseLocations.find((loc) => loc.name === warehouse.name);
    
    if (!existingLocation) {
      const [newLocation] = await knex('locations')
        .insert({
          id: knex.raw('uuid_generate_v4()'),
          location_type_id: warehouseLocationTypeId,
          name: warehouse.name,
          address: `Address for ${warehouse.name}`,
          status_id: activeStatusId,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
          created_by: adminUserId,
          updated_by: adminUserId,
        })
        .returning(['id', 'name']); // Ensure compatibility
      
      warehouseLocations.push(newLocation);
    }
  }
  
  // Fetch updated warehouse locations again
  warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id', 'name');
  
  // Ensure each warehouse has a unique location
  const warehouseEntries = warehouseData.map((warehouse) => {
    const location = warehouseLocations.find((loc) => loc.name === warehouse.name);
    return {
      id: knex.raw('uuid_generate_v4()'),
      name: warehouse.name,
      location_id: location.id,
      storage_capacity: warehouse.storage_capacity,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    };
  });
  
  // Insert warehouses & ignore duplicates
  await knex('warehouses')
    .insert(warehouseEntries)
    .onConflict(['name', 'location_id'])
    .ignore(); // Skip if exists
  
  console.log(`${warehouseEntries.length} warehouses seeded successfully.`);
};
