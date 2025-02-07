const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Insert initial statuses
  const warehouseStatus = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'available',
      description: 'Lot is in stock and ready for use.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'reserved',
      description: 'Lot is allocated for an order but not yet shipped.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'quarantined',
      description: 'Lot is under inspection (e.g., quality check, contamination).',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'damaged',
      description: 'Lot has been damaged and needs to be removed or adjusted.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'expired',
      description: 'Lot has passed its expiry date.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'consumed',
      description: 'Lot was used for production or internal purposes.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'disposed',
      description: 'Lot was removed due to spoilage, damage, or expiry.',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    },
  ];
  
  await knex('warehouse_lot_status')
    .insert(warehouseStatus)
    .onConflict(['name'])
    .ignore(); // Avoid duplicate entries
  
  console.log(`${warehouseStatus.length} warehouse lot status seeded successfully.`);
};
