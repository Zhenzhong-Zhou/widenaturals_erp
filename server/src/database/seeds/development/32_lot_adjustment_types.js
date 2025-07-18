const { fetchDynamicValue } = require('../03_utils');
const {
  generateStandardizedCode,
  generateCodeOrSlug,
} = require('../../../utils/code-generators');

exports.seed = async function (knex) {
  const table = 'lot_adjustment_types';

  // Skip if data already exists
  const existing = await knex(table).select('id').limit(1);
  if (existing.length > 0) {
    console.log(`Skipping ${table} seed: data already exists.`);
    return;
  }

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const actionMap = {
    manual_stock_insert: 'manual_stock_insert',
    manual_stock_update: 'manual_stock_insert_update',
    damaged: 'damaged',
    lost: 'lost',
    defective: 'damaged',
    expired: 'expired',
    stolen: 'lost',
    returned: 'returned',
    recalled: 'recalled',
    adjustment: 'manual_adjustment',
    reclassified: 'manual_adjustment',
    conversion: 'repackaged',
    transferred: 'transferred',
    quarantined: 'quarantined',
    resampled: 'quarantined',
    repackaged: 'repackaged',
  };

  const descriptionsMap = {
    manual_stock_insert: 'Manual stock insertion into the system',
    manual_stock_update: 'Manual update of stock quantity or status',
    damaged: 'Inventory marked as damaged',
    lost: 'Inventory lost during handling or transit',
    defective: 'Defective product detected during inspection',
    expired: 'Inventory expired and not suitable for sale/use',
    stolen: 'Inventory reported as stolen',
    returned: 'Inventory returned from customer or distributor',
    recalled: 'Inventory recalled due to compliance or quality issues',
    adjustment: 'General stock adjustment',
    reclassified: 'Inventory reclassified into a different category/status',
    conversion: 'Inventory converted to another type or package',
    transferred: 'Inventory transferred to another location/warehouse',
    quarantined: 'Inventory placed in quarantine for inspection or hold',
    resampled: 'Inventory resampled for QA purposes',
    repackaged: 'Inventory repackaged due to damage or requirement',
  };

  const departmentGroupMap = {
    manual_stock_insert: 'warehouse_ops',
    manual_stock_update: 'warehouse_ops',
    damaged: 'quality_control',
    defective: 'quality_control',
    expired: 'quality_control',
    lost: 'warehouse_ops',
    stolen: 'warehouse_ops',
    returned: 'customer_service',
    recalled: 'quality_control',
    adjustment: 'admin',
    reclassified: 'admin',
    conversion: 'supply_chain',
    transferred: 'warehouse_ops',
    quarantined: 'quality_control',
    resampled: 'quality_control',
    repackaged: 'supply_chain',
  };

  let sequence = 1;

  for (const [name, actionName] of Object.entries(actionMap)) {
    const code = generateStandardizedCode('LAT', name, {
      sequenceNumber: sequence++,
    });
    const slug = generateCodeOrSlug(name, { sequenceNumber: sequence++ });

    const actionTypeId = await fetchDynamicValue(
      knex,
      'inventory_action_types',
      'name',
      actionName,
      'id'
    );

    await knex(table)
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name,
        code,
        slug,
        description: descriptionsMap[name],
        inventory_action_type_id: actionTypeId,
        department_group: departmentGroupMap[name],
        is_active: true,
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemUserId,
        updated_by: null,
      })
      .onConflict('name')
      .ignore();
  }

  console.log(`${Object.keys(actionMap).length} ${table} records seeded.`);
};
