const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse_types...');

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  const now = knex.fn.now();

  const warehouseTypes = [
    {
      name: 'distribution_center',
      description: 'Main facility for receiving and distributing stock',
    },
    {
      name: 'storage_only',
      description: 'Passive warehouse for overflow or long-term storage',
    },
    {
      name: 'cold_storage',
      description: 'Temperature-controlled storage for sensitive products',
    },
    {
      name: 'quarantine',
      description: 'Holds inventory pending quality check or inspection',
    },
    {
      name: 'external',
      description: 'Operated by a third-party or offsite partner',
    },
  ];

  const records = warehouseTypes.map((t) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: t.name,
    description: t.description,
    is_active: true,
    created_at: now,
    updated_at: now,
    created_by: systemUserId,
    updated_by: null,
  }));

  await knex('warehouse_types').insert(records).onConflict('name').ignore();

  console.log(`Seeded ${records.length} warehouse types.`);
};
