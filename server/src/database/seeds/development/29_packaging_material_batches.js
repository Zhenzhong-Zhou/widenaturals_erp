/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging_material_batches...');
  
  // --- Skip if already seeded
  const [{ count }] = await knex('packaging_material_batches').count('id');
  const total = Number(count) || 0;
  
  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping [packaging_material_batches]: ${total} existing records.`
    );
    return;
  }
  
  console.log(
    `[${new Date().toISOString()}] [SEED] Inserting into [packaging_material_batches]...`
  );
  
  // --- System user for audit
  const systemUserId = await knex('users')
    .select('id')
    .whereILike('email', 'system@internal.local')
    .first()
    .then((row) => row?.id);
  
  // --- Active status id
  const activeBatchStatusId = await knex('batch_status')
    .select('id')
    .whereILike('name', 'active')
    .first()
    .then((row) => row?.id);
  
  // --- Supplier links for 'Unspecified Supplier'
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
  
  // --- Preload packaging materials
  const materialIds = supplierLinks.map((l) => l.packaging_material_id);
  const materialMap = await knex('packaging_materials')
    .select('id', 'name')
    .whereIn('id', materialIds)
    .then((rows) => {
      const map = new Map();
      rows.forEach((r) => map.set(r.id, r.name));
      return map;
    });
  
  // --- Create seed data
  const defaultCurrency = 'CAD';
  const defaultExchangeRate = 1.0; // assume base currency CAD
  const defaultUnitCost = 0.25; // example unit cost
  
  const batches = supplierLinks.map((link, i) => {
    const lotNumber = `PMB-LOT-${1000 + i}`;
    const materialName =
      materialMap.get(link.packaging_material_id) ??
      `Snapshot Material ${i + 1}`;
    const quantity = 100 + i * 25;
    const unitCost = defaultUnitCost + i * 0.05;
    const totalCost = Number((quantity * unitCost).toFixed(4));
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      packaging_material_supplier_id: link.id,
      lot_number: lotNumber,
      material_snapshot_name: materialName,
      received_label_name: `Supplier Label ${i + 1}`,
      quantity,
      unit: 'pcs',
      manufacture_date: new Date(Date.UTC(2021, 0, 10 + i)), // Jan 10+
      expiry_date: new Date(Date.UTC(2024, 0, 10 + i)), // Jan 10+ 3 years later
      
      // --- newly added fields ---
      unit_cost: unitCost,
      currency: defaultCurrency,
      exchange_rate: defaultExchangeRate,
      total_cost: totalCost,
      
      status_id: activeBatchStatusId,
      status_date: knex.fn.now(),
      received_at: knex.fn.now(),
      received_by: systemUserId,
      
      created_at: knex.fn.now(),
      created_by: systemUserId,
      updated_at: null,
      updated_by: null,
    };
  });
  
  // --- Insert batches
  if (batches.length > 0) {
    await knex('packaging_material_batches')
      .insert(batches)
      .onConflict(['packaging_material_supplier_id', 'lot_number'])
      .ignore();
    
    console.log(
      `[${new Date().toISOString()}] [SEED] Inserted ${batches.length} packaging_material_batches (duplicates ignored).`
    );
  }
  
  console.log(`[${new Date().toISOString()}] [SEED] Completed packaging_material_batches.`);
};
