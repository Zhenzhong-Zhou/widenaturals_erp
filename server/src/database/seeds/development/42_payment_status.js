const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding payment_status...');
  
  const existing = await knex('payment_status').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Payment statuses already seeded. Skipping.');
    return;
  }
  
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
      name: 'Pending',
      code: 'PENDING',
      description: 'Payment has not been received yet',
      is_active: true,
      display_order: 1,
    },
    {
      name: 'Paid',
      code: 'PAID',
      description: 'Payment successfully received',
      is_active: true,
      display_order: 2,
    },
    {
      name: 'Failed',
      code: 'FAILED',
      description: 'Payment attempt failed',
      is_active: false,
      display_order: 3,
    },
    {
      name: 'Refunded',
      code: 'REFUNDED',
      description: 'Payment has been refunded',
      is_active: false,
      display_order: 4,
    },
  ];
  
  const records = statusList.map((status) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: status.name,
    code: status.code,
    description: status.description,
    is_active: status.is_active,
    display_order: status.display_order,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('payment_status').insert(records).onConflict('code').ignore();
  
  console.log(`Seeded ${records.length} payment statuses.`);
};
