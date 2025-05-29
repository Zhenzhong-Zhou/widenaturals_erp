const { fetchDynamicValue } = require('../03_utils');
const { generateStandardizedCode, generateCodeOrSlug } = require('../../../utils/code-generators');

exports.seed = async function (knex) {
  // Pre-check: Skip seeding if any lot_adjustment_types already exist
  const existing = await knex('lot_adjustment_types').select('id').limit(1);
  if (existing.length > 0) {
    console.log('Skipping lot_adjustment_types seed: data already exists.');
    return;
  }
  
  const adminUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'admin@example.com',
    'id'
  );
  
  const actionMap = {
    'manual_stock_insert': 'manual_stock_insert',
    'manual_stock_update': 'manual_stock_insert_update',
    'damaged': 'damaged',
    'lost': 'lost',
    'defective': 'damaged',
    'expired': 'expired',
    'stolen': 'lost',
    'returned': 'returned',
    'recalled': 'recalled',
    'adjustment': 'manual_adjustment',
    'reclassified': 'manual_adjustment',
    'conversion': 'repackaged',
    'transferred': 'transferred',
    'quarantined': 'quarantined',
    'resampled': 'quarantined',
    'repackaged': 'repackaged',
  };
  
  const lotAdjustmentTypes = Object.entries(actionMap).map(([name, action]) => ({
    name,
    actionName: action,
    description: name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
  
  let sequence = 1;
  
  for (const type of lotAdjustmentTypes) {
    const code = generateStandardizedCode('LAT', type.name, { sequenceNumber: sequence++ });
    const slug = generateCodeOrSlug(type.name, { sequenceNumber: sequence++ });
    
    const actionTypeId = await fetchDynamicValue(
      knex,
      'inventory_action_types',
      'name',
      type.actionName,
      'id'
    );
    
    await knex('lot_adjustment_types')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: type.name,
        code,
        slug,
        description: type.description,
        inventory_action_type_id: actionTypeId,
        is_active: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .onConflict('name')
      .ignore();
  }
  
  console.log(`${lotAdjustmentTypes.length} lot adjustment types seeded.`);
};
