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
      name: 'Unpaid',
      code: 'UNPAID',
      description: 'Order created but payment not yet made',
      is_active: true,
      display_order: 1,
    },
    {
      name: 'Pending',
      code: 'PENDING',
      description: 'Payment is being processed or under review',
      is_active: true,
      display_order: 2,
    },
    {
      name: 'Paid',
      code: 'PAID',
      description: 'Payment successfully received',
      is_active: true,
      display_order: 3,
    },
    {
      name: 'Partially Paid',
      code: 'PARTIALLY_PAID',
      description: 'Partial payment received, balance still due',
      is_active: true,
      display_order: 4,
    },
    {
      name: 'Failed',
      code: 'FAILED',
      description: 'Payment attempt failed or rejected',
      is_active: true,
      display_order: 5,
    },
    {
      name: 'Overpaid',
      code: 'OVERPAID',
      description: 'Received amount exceeds invoice total',
      is_active: true,
      display_order: 6,
    },
    {
      name: 'Refunded',
      code: 'REFUNDED',
      description: 'Full payment has been refunded',
      is_active: true,
      display_order: 7,
    },
    {
      name: 'Partially Refunded',
      code: 'PARTIALLY_REFUNDED',
      description: 'Only part of the payment was refunded',
      is_active: true,
      display_order: 8,
    },
    {
      name: 'Voided',
      code: 'VOIDED',
      description: 'Payment was voided before processing',
      is_active: false,
      display_order: 9,
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
