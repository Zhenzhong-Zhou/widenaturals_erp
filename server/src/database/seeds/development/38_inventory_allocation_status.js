/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  const existing = await knex('inventory_allocation_status')
    .select('id')
    .first();
  if (existing) {
    console.log(
      'Skipping seeding: `inventory_allocation_status` already has data.'
    );
    return;
  }

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const allocationStatuses = [
    {
      name: 'pending',
      code: 'ALLOC_PENDING',
      description: 'Allocation is pending and has not been confirmed yet.',
      is_final: false,
    },
    {
      name: 'confirmed',
      code: 'ALLOC_CONFIRMED',
      description: 'Allocation has been confirmed but not yet executed.',
      is_final: false,
    },
    {
      name: 'partially_allocated',
      code: 'ALLOC_PARTIAL',
      description:
        'Only a portion of the required inventory has been allocated.',
      is_final: false,
    },
    {
      name: 'allocated',
      code: 'ALLOC_COMPLETED',
      description: 'Inventory has been successfully allocated for the order.',
      is_final: false,
    },
    {
      name: 'fulfilling',
      code: 'ALLOC_FULFILLING',
      description:
        'Inventory is being picked, packed, or transferred (fulfillment in progress).',
      is_final: false,
    },
    {
      name: 'fulfilled',
      code: 'ALLOC_FULFILLED',
      description:
        'Inventory has been picked/shipped/transferred and fulfilled.',
      is_final: true,
    },
    {
      name: 'cancelled',
      code: 'ALLOC_CANCELLED',
      description: 'Allocation was cancelled and will not be fulfilled.',
      is_final: true,
    },
  ];

  const inserted = await knex('inventory_allocation_status')
    .insert(
      allocationStatuses.map((status) => ({
        id: knex.raw('uuid_generate_v4()'),
        name: status.name,
        code: status.code,
        description: status.description,
        is_final: status.is_final,
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemUserId,
        updated_by: null,
      }))
    )
    .onConflict(['name'])
    .ignore();

  console.log(
    `Seeded ${
      inserted?.rowCount || allocationStatuses.length
    } records into 'inventory_allocation_status'.`
  );
};
