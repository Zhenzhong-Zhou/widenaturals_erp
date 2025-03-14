const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  // Insert initial statuses
  const warehouseStatus = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'in_stock',
      description: 'Lot is in stock and available for use.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'out_of_stock',
      description: 'Lot has been fully used or sold and is now depleted.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'unavailable',
      description:
        'Lot exists but cannot be used due to restrictions, quality checks, or pending approval.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'unassigned',
      description: 'The product arrived without a proper lot assignment.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'sold_out',
      description:
        'Lot is completely depleted and no further stock is expected.',
      is_active: false, // Marked as inactive if no adjustments or restocking are allowed
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'reserved',
      description: 'Lot is allocated for an order but not yet shipped.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'quarantined',
      description:
        'Lot is under inspection (e.g., quality check, contamination).',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'damaged',
      description: 'Lot has been damaged and needs to be removed or adjusted.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'expired',
      description: 'Lot has passed its expiry date.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'consumed',
      description: 'Lot was used for production or internal purposes.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'disposed',
      description: 'Lot was removed due to spoilage, damage, or expiry.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'suspended',
      description:
        'Lot is temporarily blocked from sale due to pending quality checks or administrative holds.',
      is_active: true, // It should be selectable as an active status
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
  ];

  await knex('warehouse_lot_status')
    .insert(warehouseStatus)
    .onConflict(['name'])
    .ignore(); // Avoid duplicate entries

  console.log(
    `${warehouseStatus.length} warehouse lot status seeded successfully.`
  );
};
