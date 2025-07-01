const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding payment_methods...');
  
  const existing = await knex('payment_methods').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Payment methods already seeded. Skipping.');
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
  
  const methodList = [
    {
      name: 'Credit Card',
      code: 'CREDIT_CARD',
      description: 'Payment via Visa, Mastercard, or other credit cards',
      is_active: true,
      display_order: 1,
    },
    {
      name: 'Bank Transfer',
      code: 'BANK_TRANSFER',
      description: 'Manual bank-to-bank transfer',
      is_active: true,
      display_order: 2,
    },
    {
      name: 'Cash',
      code: 'CASH',
      description: 'Cash payment upon delivery',
      is_active: true,
      display_order: 3,
    },
  ];
  
  const records = methodList.map((method) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: method.name,
    code: method.code,
    description: method.description,
    is_active: method.is_active,
    display_order: method.display_order,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('payment_methods').insert(records).onConflict('code').ignore();
  
  console.log(`Seeded ${records.length} payment methods.`);
};
