const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  const locationTypes = [
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'WAREHOUSE',
      name: 'Warehouse',
      description: 'Storage location for inventory',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'RETAIL',
      name: 'Retail',
      description: 'Retail outlet for direct sales',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'DISTRIBUTION',
      name: 'Distribution Center',
      description: 'Central hub for distributing goods',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    // Add other entries as needed
  ];
  
  for (const type of locationTypes) {
    await knex('location_types')
      .insert(type)
      .onConflict(['code', 'name'])
      .ignore();
  }
  
  console.log(`${locationTypes.length} location types seeded successfully.`);
};
