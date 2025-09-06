/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging_material_batches...');
  
  const [{ count }] = await knex('packaging_material_batches').count('id');
  const total = Number(count) || 0;
  
  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping seed for [packaging_material_batches] table: ${total} records found.`
    );
    return;
  }
  
  console.log(
    `[${new Date().toISOString()}] [SEED] Inserting records into [packaging_material_batches] table...`
  );

  // Get system user for audit
  const systemUserId = await knex('users')
    .select('id')
    .whereILike('email', 'system@internal.local')
    .first()
    .then((row) => row?.id);
  
  // Get 'active' status for batches
  const activeBatchStatusId = await knex('batch_status')
    .select('id')
    .whereILike('name', 'active')
    .first()
    .then((row) => row?.id);
  
  // Fetch supplier links for 'Unspecified Supplier'
  const supplierLinks = await knex('packaging_material_suppliers')
    .select('id', 'packaging_material_id')
    .whereIn(
      'supplier_id',
      knex('suppliers').select('id').whereILike('name', 'Unspecified Supplier')
    );
  
  if (!supplierLinks.length) {
    console.warn('No supplier links found for Unspecified Supplier.');
    return;
  }
  
  // Preload packaging material names (optional: cache in a map)
  const materialIds = supplierLinks.map((link) => link.packaging_material_id);
  const materialMap = await knex('packaging_materials')
    .select('id', 'name')
    .whereIn('id', materialIds)
    .then((rows) => {
      const map = new Map();
      rows.forEach((row) => map.set(row.id, row.name));
      return map;
    });
  
  // Create batches with snapshot name from packaging material
  const batches = supplierLinks.map((link, index) => {
    const lotNumber = `PMB-LOT-${1000 + index}`;
    const rawMaterialName = materialMap.get(link.packaging_material_id);
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      packaging_material_supplier_id: link.id,
      lot_number: lotNumber,
      material_snapshot_name: rawMaterialName ?? `Snapshot Material ${index + 1}`,
      received_label_name: `Supplier Label ${index + 1}`,
      quantity: 100 + index * 25,
      unit: 'pcs',
      manufacture_date: new Date(Date.UTC(2021, 0, 10 + index)), // Jan 10+
      expiry_date: new Date(Date.UTC(2024, 0, 10 + index)), // Jan 10+ 3 years later
      status_id: activeBatchStatusId,
      status_date: knex.fn.now(),
      received_at: null,
      received_by: null,
      created_at: knex.fn.now(),
      created_by: systemUserId,
      updated_at: null,
      updated_by: null,
    };
  });
  
  if (batches.length > 0) {
    await knex('packaging_material_batches')
      .insert(batches)
      .onConflict(['packaging_material_supplier_id', 'lot_number']) // match your unique constraint
      .ignore();
    
    console.log(
      `Attempted to insert ${batches.length} packaging_material_batches (duplicates ignored).`
    );
  }
  
  console.log(`Seeded packaging_material_batches successfully.`);
};
