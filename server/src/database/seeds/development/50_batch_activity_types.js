const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  console.log('Seeding batch_activity_types...');

  const existing = await knex('batch_activity_types')
    .count('id as count')
    .first();

  if (Number(existing?.count) > 0) {
    console.log('Batch activity types already seeded. Skipping.');
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

  const activityTypes = [
    {
      name: 'Batch Created',
      code: 'BATCH_CREATED',
      description: 'Batch record created in the system',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Status Changed',
      code: 'BATCH_STATUS_CHANGED',
      description: 'Batch status updated',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Quantity Adjusted',
      code: 'BATCH_QUANTITY_ADJUSTED',
      description: 'Batch inventory quantity manually adjusted',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Inventory Allocated',
      code: 'BATCH_INVENTORY_ALLOCATED',
      description: 'Batch inventory allocated to an order or transfer',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Inventory Released',
      code: 'BATCH_INVENTORY_RELEASED',
      description: 'Allocated inventory released back to available stock',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch QA Updated',
      code: 'BATCH_QA_UPDATED',
      description: 'Quality assurance result recorded or updated',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Compliance Updated',
      code: 'BATCH_COMPLIANCE_UPDATED',
      description: 'Compliance or regulatory information updated',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Received',
      code: 'BATCH_RECEIVED',
      description: 'Batch physically received into the warehouse',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Quarantined',
      code: 'BATCH_QUARANTINED',
      description: 'Batch moved to quarantine status for quality inspection',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Released',
      code: 'BATCH_RELEASED',
      description: 'Batch released for operational use after QA approval',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Metadata Updated',
      code: 'BATCH_METADATA_UPDATED',
      description: 'Batch metadata updated',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Expiry Updated',
      code: 'BATCH_EXPIRY_UPDATED',
      description: 'Batch expiry date corrected or updated',
      is_system: true,
      is_active: true,
    },
    {
      name: 'Batch Location Updated',
      code: 'BATCH_LOCATION_UPDATED',
      description: 'Batch location or warehouse assignment changed',
      is_system: true,
      is_active: true,
    },
  ];

  const records = activityTypes.map((activity) => ({
    id: knex.raw('uuid_generate_v4()'),
    ...activity,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));

  await knex('batch_activity_types')
    .insert(records)
    .onConflict('code')
    .ignore();

  console.log(`Seeded ${records.length} batch activity types.`);
};
