const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
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

  const locationTypes = [
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'VANCOUVER_OFFICE',
      name: 'Office',
      description: 'Main office location for administrative work.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'WAREHOUSE',
      name: 'Warehouse',
      description: 'Storage location for inventory',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'RETAIL',
      name: 'Retail',
      description: 'Retail outlet for direct sales',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'DISTRIBUTION',
      name: 'Distribution Center',
      description: 'Central hub for distributing goods',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      code: 'MANUFACTURER',
      name: 'Manufacturer Facility',
      description: 'Facility responsible for producing and assembling products',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
  ];

  for (const type of locationTypes) {
    await knex('location_types')
      .insert(type)
      .onConflict(['code', 'name'])
      .ignore();
  }

  console.log(`${locationTypes.length} location types seeded successfully.`);
};
