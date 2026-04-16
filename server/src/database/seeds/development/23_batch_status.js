const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding batch_status...');

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const now = knex.fn.now();

  const statusList = [
    {
      name: 'pending',
      description: 'Batch created but awaiting verification or QA review',
      is_active: true,
    },
    {
      name: 'received',
      description:
        'Batch physically received from supplier but not yet verified',
      is_active: true,
    },
    {
      name: 'quarantined',
      description: 'Batch held for quality inspection or investigation',
      is_active: true,
    },
    {
      name: 'released',
      description: 'Batch approved and available for operations',
      is_active: true,
    },
    {
      name: 'rejected',
      description: 'Batch rejected due to failed quality inspection',
      is_active: false,
    },
    {
      name: 'suspended',
      description: 'Batch temporarily blocked due to operational or QA issues',
      is_active: true,
    },
    {
      name: 'expired',
      description: 'Batch has passed its expiry date',
      is_active: false,
    },
    {
      name: 'consumed',
      description: 'Batch fully used in manufacturing or fulfillment',
      is_active: false,
    },
    {
      name: 'archived',
      description: 'Batch record retained for historical reference',
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

  await knex('batch_status').insert(records).onConflict('name').ignore();

  console.log(`Seeded ${records.length} batch statuses.`);
};
