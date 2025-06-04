const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding batch_status...');
  
  const systemUserId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  
  const now = knex.fn.now();
  
  const statusList = [
    {
      name: 'active',
      description: 'Batch is verified and can be used in operations',
      is_active: true,
    },
    {
      name: 'expired',
      description: 'Batch has passed its expiry date',
      is_active: false,
    },
    {
      name: 'quarantined',
      description: 'Batch is under investigation or quality check',
      is_active: true,
    },
    {
      name: 'suspended',
      description: 'Batch temporarily blocked due to admin/QA issues',
      is_active: true,
    },
    {
      name: 'archived',
      description: 'Batch is no longer in use, e.g., fully used',
      is_active: false,
    },
  ];
  
  const records = statusList.map((status) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: status.name,
    description: status.description,
    is_active: status.is_active,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('batch_status')
    .insert(records)
    .onConflict('name')
    .ignore();
  
  console.log(`Seeded ${records.length} batch statuses.`);
};
