/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */

const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  console.log('Seeding fulfillment_status...');

  const existing = await knex('fulfillment_status')
    .count('id as count')
    .first();
  if (existing?.count > 0) {
    console.log('Fulfillment status already seeded. Skipping.');
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
      code: 'FULFILLMENT_PENDING',
      sort_order: 1,
      category: 'internal',
      is_default: true,
      description: 'Order is pending fulfillment',
    },
    {
      name: 'picking',
      code: 'FULFILLMENT_PICKING',
      sort_order: 2,
      category: 'internal',
      is_default: false,
      description: 'Items are being picked from inventory',
    },
    {
      name: 'packed',
      code: 'FULFILLMENT_PACKED',
      sort_order: 3,
      category: 'internal',
      is_default: false,
      description: 'Items are packed and ready to ship',
    },
    {
      name: 'completed',
      code: 'FULFILLMENT_COMPLETED',
      sort_order: 4,
      category: 'internal',
      is_default: false,
      description:
        'Fulfillment process completed — items have been delivered or picked up by the customer.',
    },
    {
      name: 'shipped',
      code: 'FULFILLMENT_SHIPPED',
      sort_order: 5,
      category: 'external',
      is_default: false,
      description: 'Shipment has been dispatched',
    },
    {
      name: 'delivered',
      code: 'FULFILLMENT_DELIVERED',
      sort_order: 6,
      category: 'external',
      is_default: false,
      description: 'Order has been delivered to customer',
    },
    {
      name: 'cancelled',
      code: 'FULFILLMENT_CANCELLED',
      sort_order: 99,
      category: 'internal',
      is_default: false,
      description: 'Fulfillment was cancelled',
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

  await knex('fulfillment_status').insert(records);

  console.log(`Seeded ${records.length} fulfillment statuses.`);
};
