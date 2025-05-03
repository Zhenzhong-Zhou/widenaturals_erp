const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('Seeding bom_items (shared + custom)...');
  
  const createdBy = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  
  const [boms, parts] = await Promise.all([
    knex('boms').select('id', 'code'),
    knex('parts').select('id', 'code'),
  ]);
  
  const bomMap = Object.fromEntries(boms.map((b) => [b.code, b.id]));
  const partMap = Object.fromEntries(parts.map((p) => [p.code, p.id]));
  
  const sharedBomCodes = [
    'BOM-CH-HN100-R-CN', 'BOM-CH-HN101-R-CA', 'BOM-CH-HN102-R-CN',
    'BOM-CH-HN103-R-CA', 'BOM-CH-HN104-R-CN', 'BOM-CH-HN105-R-CA',
    'BOM-CH-HN106-R-CN', 'BOM-CH-HN107-R-CA', 'BOM-CH-HN108-R-CN',
    'BOM-CH-HN109-R-CA', 'BOM-CH-HN110-R-CN', 'BOM-CH-HN111-R-CA',
    'BOM-CH-HN112-R-CN', 'BOM-CH-HN113-R-CA', 'BOM-CH-HN116-R-UN',
  ];
  
  const sharedItems = [
    { code: 'PART-LID', qty: 1, unit: 'pc', color: 'white', material: 'plastic', material_grade: 'food' },
    { code: 'SEAL-TAMPER', qty: 1, unit: 'pc', color: 'white', material: 'foam', material_grade: 'food' },
    { code: 'DSC-PACKET', qty: 1, unit: 'pc', color: 'clear', material: 'plastic', material_grade: 'food', note: 'desiccant plug' },
    { code: 'CAP-VEG', qty: 60, unit: 'pcs', size: '0 size', color: 'clear', material: 'vegan', material_grade: 'food' },
    { code: 'PART-FILLER', qty: 1, unit: 'pc', color: 'clear', material: 'plastic', material_grade: 'food' },
    { code: 'PART-BOTTLE', qty: 1, unit: 'pc', size: '250ml', material: 'plastic', material_grade: 'food' },
    { code: 'LBL-STD', qty: 1, unit: 'pc', length_cm: 19.6, width_cm: 7.0, material: 'paper' },
    { code: 'BOX-STD', qty: 1, unit: 'pc', length_cm: 6.4, width_cm: 6.4, height_cm: 11.3, material: 'cardboard' },
  ];
  
  // Helper to create a bom_items row
  const generateBomItemRow = (bom_id, item) => ({
    id: knex.raw('uuid_generate_v4()'),
    bom_id,
    part_id: partMap[item.code],
    quantity_per_unit: item.qty,
    unit: item.unit,
    size: item.size || null,
    color: item.color || null,
    material: item.material || null,
    material_grade: item.material_grade || null,
    length_cm: item.length_cm || null,
    width_cm: item.width_cm || null,
    height_cm: item.height_cm || null,
    weight_g: item.weight_g || null,
    estimated_unit_cost: item.unit_cost || null,
    currency: item.currency || null,
    note: item.note || null,
    created_by: createdBy,
    updated_by: null,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
  
  const rows = [];
  
  // Insert shared items
  for (const bomCode of sharedBomCodes) {
    const bom_id = bomMap[bomCode];
    if (!bom_id) continue;
    for (const item of sharedItems) {
      if (!partMap[item.code]) continue;
      rows.push(generateBomItemRow(bom_id, item));
    }
  }
  
  // Insert custom items
  for (const def of require('./data/bom_items_customBomDefs')) {
    const bom_id = bomMap[def.bomCode];
    if (!bom_id) continue;
    for (const item of def.items) {
      if (!partMap[item.code]) continue;
      rows.push(generateBomItemRow(bom_id, item));
    }
  }
  
  if (rows.length > 0) {
    await knex('bom_items')
      .insert(rows)
      .onConflict(['bom_id', 'part_id', 'length_cm', 'width_cm', 'height_cm', 'color', 'material'])
      .ignore();
    console.log(`Seeded ${rows.length} BOM item records.`);
  }
};
