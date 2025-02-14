const { fetchDynamicValue } = require('../03_utils');

exports.seed = async function (knex) {
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );

  const inventoryActions = [
    {
      name: 'manual_adjustment',
      description: 'Manual stock adjustment',
      status_id: activeStatusId,
      default_action: true, // System default action
    },
    {
      name: 'restock',
      description: 'Stock added from supplier or production',
      status_id: activeStatusId,
      default_action: true,
    },
    {
      name: 'sold',
      description: 'Stock deducted due to sales',
      status_id: activeStatusId,
      default_action: true,
    },
    {
      name: 'damaged',
      description: 'Stock deducted due to damage',
      status_id: activeStatusId,
      default_action: true,
    },
    {
      name: 'lost',
      description: 'Stock deducted due to loss or theft',
      status_id: activeStatusId,
      default_action: false,
    },
    {
      name: 'returned',
      description: 'Stock returned from customers or suppliers',
      status_id: activeStatusId,
      default_action: true,
    },
    {
      name: 'expired',
      description: 'Stock deducted due to expiration',
      status_id: activeStatusId,
      default_action: false,
    },
    {
      name: 'recalled',
      description: 'Stock removed due to safety concerns',
      status_id: activeStatusId,
      default_action: false,
    },
    {
      name: 'repackaged',
      description: 'Stock modified (e.g., repackaged into smaller units)',
      status_id: activeStatusId,
      default_action: false,
    },
    {
      name: 'quarantined',
      description: 'Stock placed on hold for inspection or testing',
      status_id: activeStatusId,
      default_action: false,
    },
    {
      name: 'transferred',
      description: 'Stock moved between warehouses or locations',
      status_id: activeStatusId,
      default_action: true,
    },
  ];

  // Insert data while avoiding duplicates
  for (const action of inventoryActions) {
    await knex('inventory_action_types')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: action.name,
        description: action.description,
        status_id: action.status_id,
        default_action: action.default_action,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .onConflict('name')
      .ignore();
  }

  console.log(
    `${inventoryActions.length} Inventory action types seeded successfully.`
  );
};
