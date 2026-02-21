/**
 * @param {import("knex").Knex} knex
 */

const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  console.log('Seeding transfer_order_item_status...');
  
  const existing = await knex('transfer_order_item_status')
    .count('id as count')
    .first();
  
  if (Number(existing?.count) > 0) {
    console.log('Transfer order item status already seeded. Skipping.');
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
      name: 'pending',
      code: 'TRANSFER_ITEM_PENDING',
      description: 'Item created but not yet processed',
      is_active: true,
    },
    {
      name: 'allocated',
      code: 'TRANSFER_ITEM_ALLOCATED',
      description: 'Inventory allocated for transfer',
      is_active: true,
    },
    {
      name: 'transferred',
      code: 'TRANSFER_ITEM_TRANSFERRED',
      description: 'Item successfully transferred to destination',
      is_active: true,
    },
    {
      name: 'cancelled',
      code: 'TRANSFER_ITEM_CANCELLED',
      description: 'Transfer item cancelled before completion',
      is_active: true,
    },
    {
      name: 'failed',
      code: 'TRANSFER_ITEM_FAILED',
      description: 'Transfer failed due to validation or system issue',
      is_active: true,
    },
  ];
  
  const records = statusList.map((status) => ({
    id: knex.raw('uuid_generate_v4()'),
    ...status,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('transfer_order_item_status')
    .insert(records)
    .onConflict('code')
    .ignore();
  
  console.log(`Seeded ${records.length} transfer order item statuses.`);
};
