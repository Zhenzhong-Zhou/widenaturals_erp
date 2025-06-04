const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  const existing = await knex('inventory_action_types').select('id').limit(1);

  if (existing.length > 0) {
    console.log('Skipping inventory_action_types seed: data already exists.');
    return;
  }

  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );

  const adminUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'admin@example.com',
    'id'
  );

  const inventoryActions = [
    {
      name: 'initial_load',
      description: 'Initial inventory entry at system setup.',
      category: 'system',
      is_adjustment: false,
      affects_financials: false,
      requires_audit: false,
      default_action: true,
    },
    {
      name: 'manual_adjustment',
      description: 'Manual adjustment for inventory correction.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'manual_stock_insert',
      description: 'Manual inventory input via UI.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'manual_stock_insert_update',
      description: 'Adjustment after manual insert.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'restock',
      description: 'Stock replenishment from supplier/production.',
      category: 'transaction',
      is_adjustment: false,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'sold',
      description: 'Stock deducted due to sales.',
      category: 'transaction',
      is_adjustment: false,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'damaged',
      description: 'Stock loss due to damage.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'lost',
      description: 'Inventory loss with no explanation.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: false,
    },
    {
      name: 'returned',
      description: 'Stock returned by customer/supplier.',
      category: 'transaction',
      is_adjustment: false,
      affects_financials: true,
      requires_audit: true,
      default_action: true,
    },
    {
      name: 'expired',
      description: 'Stock removed due to expiration.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: false,
    },
    {
      name: 'recalled',
      description: 'Stock removed due to compliance/safety issue.',
      category: 'adjustment',
      is_adjustment: true,
      affects_financials: true,
      requires_audit: true,
      default_action: false,
    },
    {
      name: 'repackaged',
      description: 'Stock repackaged into new form.',
      category: 'conversion',
      is_adjustment: false,
      affects_financials: false,
      requires_audit: false,
      default_action: false,
    },
    {
      name: 'quarantined',
      description: 'Stock placed on hold for QC.',
      category: 'hold',
      is_adjustment: false,
      affects_financials: false,
      requires_audit: false,
      default_action: false,
    },
    {
      name: 'transferred',
      description: 'Stock moved across locations.',
      category: 'transfer',
      is_adjustment: false,
      affects_financials: false,
      requires_audit: false,
      default_action: true,
    },
    {
      name: 'reserve',
      description: 'Inventory reserved for orders or transfers.',
      category: 'reservation',
      is_adjustment: false,
      affects_financials: false,
      requires_audit: false,
      default_action: false,
    },
  ];

  // Insert data while avoiding duplicates
  for (const action of inventoryActions) {
    await knex('inventory_action_types')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: action.name,
        description: action.description,
        category: action.category,
        is_adjustment: action.is_adjustment,
        affects_financials: action.affects_financials,
        requires_audit: action.requires_audit,
        status_id: activeStatusId,
        default_action: action.default_action,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .onConflict('name')
      .ignore();
  }

  console.log(`${inventoryActions.length} inventory action types seeded.`);
};
