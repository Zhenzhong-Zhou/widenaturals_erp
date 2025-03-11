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

  const locationTypes = await knex('location_types').select('id', 'code');
  const officeTypeId = locationTypes.find(
    (type) => type.code === 'VANCOUVER_OFFICE'
  )?.id;
  const warehouseTypeId = locationTypes.find(
    (type) => type.code === 'WAREHOUSE'
  )?.id;
  const retailTypeId = locationTypes.find((type) => type.code === 'RETAIL')?.id;
  const manufacturerTypeId = locationTypes.find((type) => type.code === 'MANUFACTURER')?.id;

  const locations = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Head Office Warehouse',
      location_type_id: warehouseTypeId,
      address: '1040 W Georgia St Unit 1050, Vancouver',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Head Office Canada',
      location_type_id: officeTypeId,
      address: '1040 W Georgia St Unit 1050, Vancouver',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Richmond Storage',
      location_type_id: warehouseTypeId,
      address: '11111 Twigg Pl Unit 1049 - 10151, Richmond, BC V6V 0B7',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Viktor Temporarily Warehouse',
      location_type_id: warehouseTypeId,
      address: '160-2639 Viking Way, Richmond, BC V6V 3B7',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Novastown Health',
      location_type_id: manufacturerTypeId,
      address: '3728 N Fraser Wy, Burnaby, BC V5J 5H4',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Canadian Phytopharmaceuticals',
      location_type_id: manufacturerTypeId,
      address: '12233 Riverside Way, Richmond, BC V6W 1K8',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
  ];

  for (const location of locations) {
    await knex('locations')
      .insert(location)
      .onConflict(['name', 'location_type_id']) // Use the unique constraint to avoid duplicates
      .ignore();
  }

  console.log(`${locations.length} locations seeded successfully.`);
};
