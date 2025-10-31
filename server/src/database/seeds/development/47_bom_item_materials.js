/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
const { fetchDynamicValue } = require('../03_utils');
exports.seed = async function (knex) {
  console.log('Seeding bom_item_materials...');
  
  // 1. Skip if table already has data
  const [{ count }] = await knex('bom_item_materials').count('* as count');
  if (Number(count) > 0) {
    console.log(`⏩ Skipping bom_item_materials seed — already has ${count} rows.`);
    return;
  }
  
  const systemUser = await knex('users')
    .select('id')
    .where({ email: 'system@internal.local' })
    .first();
  
  const now = knex.fn.now();
  
  const activeUserId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  
  // 2. Fetch all relevant data
  const bomItems = await knex('bom_items').select('id', 'part_id', 'part_qty_per_product', 'unit');
  const partMaterials = await knex('part_materials').select(
    'id',
    'part_id',
    'packaging_material_id',
    'material_qty_per_part',
    'unit'
  );
  
  const inserts = [];
  
  // 3. Build one-to-one relationships
  for (const bi of bomItems) {
    const pm = partMaterials.find((pm) => pm.part_id === bi.part_id); // use find(), not filter()
    if (pm) {
      inserts.push({
        bom_item_id: bi.id,
        part_material_id: pm.id,
        packaging_material_id: pm.packaging_material_id,
        material_qty_per_product: bi.part_qty_per_product ?? 1,
        unit: pm.unit ?? bi.unit,
        note: 'Dummy notes',
        status_id: activeUserId,
        status_date: now,
        created_by: systemUser?.id ?? null,
        updated_by: null,
        created_at: now,
        updated_at: null,
      });
    }
  }
  
  // 4. Insert safely (ignore duplicates if re-run)
  if (inserts.length > 0) {
    await knex('bom_item_materials')
      .insert(inserts)
      .onConflict(['bom_item_id', 'part_material_id'])
      .ignore();
    
    console.log(`Inserted ${inserts.length} bom_item_materials rows (duplicates ignored).`);
  } else {
    console.log('No part-material matches found for bom_items.');
  }
};
