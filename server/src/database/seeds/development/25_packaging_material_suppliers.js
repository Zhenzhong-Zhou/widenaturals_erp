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

  // --- Multi-currency snapshot (relative to CAD) ---
  const currencyRates = [
    { currency: 'CAD', rate: 1.0 }, // 1 CAD = 1 CAD
    { currency: 'USD', rate: 0.73 }, // 1 USD = 0.73 CAD
    { currency: 'EUR', rate: 0.67 }, // 1 EUR = 0.67 CAD
    { currency: 'CNY', rate: 0.19 }, // 1 CNY = 0.19 CAD
    { currency: 'HKD', rate: 0.18 }, // 1 HKD = 0.18 CAD
    { currency: 'JPY', rate: 0.0089 }, // 1 JPY = 0.0089 CAD
  ];

  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);

  // --- Build supplier-material links ---
  const supplierLinks = packagingMaterials.map((material, index) => {
    // Cycle currency pool deterministically
    const { currency, rate } = currencyRates[index % currencyRates.length];

    // Simulate contract cost variations per currency
    const baseCostCAD = 0.25 + (index % 10) * 0.05; // simple increasing base
    const contractCost = Number((baseCostCAD * rate).toFixed(4));

    // Add small valid date variations
    const validFrom = new Date(today);
    validFrom.setDate(today.getDate() - (index % 5));
    const validTo = new Date(oneYearLater);
    validTo.setDate(oneYearLater.getDate() - (index % 3));

    return {
      id: knex.raw('uuid_generate_v4()'),
      packaging_material_id: material.id,
      supplier_id: unspecifiedSupplier.id,

      // --- new fields ---
      contract_unit_cost: contractCost,
      currency,
      exchange_rate: rate,
      valid_from: validFrom,
      valid_to: validTo,

      // --- existing fields ---
      is_preferred: true,
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

  // --- Optional summary by currency for verification ---
  const summary = supplierLinks.reduce((acc, s) => {
    acc[s.currency] = (acc[s.currency] || 0) + 1;
    return acc;
  }, {});
  console.table(summary);
};
