const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouses...');

  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  // Fetch warehouse location type ID
  const warehouseLocationTypeId = await fetchDynamicValue(
    knex,
    'location_types',
    'code',
    'WAREHOUSE',
    'id'
  );

  // Fetch existing warehouse locations
  let warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id', 'name');

  // Define warehouse names and capacities
  const warehouseData = [
    { name: 'Head Office Warehouse', storage_capacity: 1000 },
    { name: 'Richmond Storage', storage_capacity: 10000 },
    { name: 'Viktor Temporarily Warehouse', storage_capacity: 5000 },
  ];
  
  // Fetch updated warehouse locations again
  warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id', 'name');

  // Ensure each warehouse has a unique location
  const warehouseEntries = warehouseData
    .map((warehouse) => {
      const location = warehouseLocations.find(
        (loc) => loc.name === warehouse.name
      );
      
      if (!location) {
        console.warn(`❗ Skipping warehouse "${warehouse.name}" as no matching location was found.`);
        return null; // Skip this entry if location is missing
      }
      
      return {
        id: knex.raw('uuid_generate_v4()'),
        name: warehouse.name,
        location_id: location.id,
        storage_capacity: warehouse.storage_capacity,
        status_id: activeStatusId,
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      };
    })
    .filter(Boolean); // Removes `null` values from the array
  
  // Insert warehouses & ignore duplicates
  if (warehouseEntries.length > 0) {
    await knex('warehouses')
      .insert(warehouseEntries)
      .onConflict(['name', 'location_id'])
      .ignore(); // Skip if exists
  }

  console.log(`${warehouseEntries.length} warehouses seeded successfully.`);
};
