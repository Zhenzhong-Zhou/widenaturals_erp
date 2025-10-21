/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging_material_suppliers...');
  
  // --- Preload system user and Unspecified Supplier ---
  const [systemUserId, unspecifiedSupplier] = await Promise.all([
    knex('users')
      .select('id')
      .whereILike('email', 'system@internal.local')
      .first()
      .then((row) => row?.id),
    
    knex('suppliers')
      .select('id')
      .whereILike('code', 'SUP-UNSPECIFIED')
      .first()
      .then((row) => row),
  ]);
  
  if (!unspecifiedSupplier) {
    throw new Error('❌ Unspecified Supplier not found. Please seed it first.');
  }
  
  // --- Fetch packaging materials ---
  const packagingMaterials = await knex('packaging_materials')
    .select('id', 'name')
    .orderBy('name');
  
  if (!packagingMaterials.length) {
    console.warn('No packaging materials found to link.');
    return;
  }
  
  console.log(
    `[${new Date().toISOString()}] [SEED] Creating links for ${packagingMaterials.length} packaging materials...`
  );
  
  // --- Default contract terms (can vary per material for realism) ---
  const baseCurrency = 'CAD';
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  
  // --- Build supplier-material links ---
  const supplierLinks = packagingMaterials.map((material, index) => {
    // Simple pattern to vary contract cost
    const contractCost = (0.25 + index * 0.05).toFixed(4);
    
    // Add slight variation in contract validity
    const validFrom = new Date(today);
    validFrom.setDate(today.getDate() - (index % 5)); // small offset
    const validTo = new Date(oneYearLater);
    validTo.setDate(oneYearLater.getDate() - (index % 3));
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      packaging_material_id: material.id,
      supplier_id: unspecifiedSupplier.id,
      
      // --- new fields ---
      contract_unit_cost: contractCost,
      currency: baseCurrency,
      valid_from: validFrom,
      valid_to: validTo,
      
      // --- existing fields ---
      is_preferred: true, // fallback preferred supplier
      lead_time_days: 10 + index, // dummy variation
      note: `Default link for ${material.name}`,
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemUserId,
      updated_by: null,
    };
  });
  
  // --- Insert with conflict protection ---
  await knex('packaging_material_suppliers')
    .insert(supplierLinks)
    .onConflict(['packaging_material_id', 'supplier_id'])
    .ignore();
  
  console.log(
    `[${new Date().toISOString()}] [SEED] Inserted ${supplierLinks.length} packaging_material_suppliers (duplicates ignored).`
  );
};
