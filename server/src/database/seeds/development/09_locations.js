const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  const locationTypes = await knex('location_types').select('id', 'code');
  const officeTypeId = locationTypes.find((type) => type.code === 'VANCOUVER_OFFICE')?.id;
  const warehouseTypeId = locationTypes.find((type) => type.code === 'WAREHOUSE')?.id;
  const retailTypeId = locationTypes.find((type) => type.code === 'RETAIL')?.id;
  
  const locations = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Head Office',
      location_type_id: officeTypeId, // Ensure this matches a valid ID in `location_types`
      address: '1040 W Georgia St Unit 1050, Vancouver',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Central Warehouse',
      location_type_id: warehouseTypeId,
      address: '123 Warehouse Lane',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Downtown Retail Store',
      location_type_id: retailTypeId,
      address: '456 Main Street',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Eastside Warehouse',
      location_type_id: warehouseTypeId,
      address: '789 Industrial Ave',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    // Add other entries as needed
  ];
  
  for (const location of locations) {
    await knex('locations')
      .insert(location)
      .onConflict(['name', 'location_type_id']) // Use the unique constraint to avoid duplicates
      .ignore();
  }
  
  console.log(`${locations.length} locations seeded successfully.`);
};
