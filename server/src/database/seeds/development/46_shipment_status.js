/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */

exports.seed = async function (knex) {
  console.log('Seeding shipment_status...');
  
  const existing = await knex('shipment_status').count('id as count').first();
  if (Number(existing?.count) > 0) {
    console.log('shipment_status already seeded. Skipping.');
    return;
  }
  
  // Optionally fetch system user ID (replace email as needed)
  const systemUser = await knex('users')
    .select('id')
    .where({ email: 'system@internal.local' })
    .first();
  
  const now = knex.fn.now();
  
  const statuses = [
    {
      name: 'Pending',
      code: 'SHIPMENT_PENDING',
      description: 'Shipment is created but not yet processed.',
      is_final: false,
    },
    {
      name: 'Ready to Ship',
      code: 'SHIPMENT_READY',
      description: 'Shipment is packed and ready to be picked up or dispatched.',
      is_final: false,
    },
    {
      name: 'In Transit',
      code: 'SHIPMENT_IN_TRANSIT',
      description: 'Shipment has left the facility and is on its way.',
      is_final: false,
    },
    {
      name: 'Delivered',
      code: 'SHIPMENT_DELIVERED',
      description: 'Shipment successfully delivered to the destination.',
      is_final: true,
    },
    {
      name: 'Cancelled',
      code: 'SHIPMENT_CANCELLED',
      description: 'Shipment was cancelled before dispatch or mid-process.',
      is_final: true,
    },
    {
      name: 'Returned',
      code: 'SHIPMENT_RETURNED',
      description: 'Shipment was returned after an unsuccessful delivery.',
      is_final: true,
    },
  ];
  
  await knex('shipment_status').insert(
    statuses.map((s) => ({
      ...s,
      id: knex.raw('uuid_generate_v4()'),
      created_by: systemUser?.id ?? null,
      updated_by: null,
      created_at: now,
      updated_at: null,
    }))
  );
  
  console.log(`Seeded ${statuses.length} shipment_status records.`);
};
