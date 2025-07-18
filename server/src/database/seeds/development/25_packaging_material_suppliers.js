/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging_material_suppliers...');

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
    throw new Error('Unspecified Supplier not found. Please seed it first.');
  }

  const packagingMaterials = await knex('packaging_materials')
    .select('id', 'name')
    .orderBy('name');

  const supplierLinks = packagingMaterials.map((material, index) => ({
    id: knex.raw('uuid_generate_v4()'),
    packaging_material_id: material.id,
    supplier_id: unspecifiedSupplier.id,
    is_preferred: true, // Make unspecified supplier preferred by default
    lead_time_days: 10 + index, // Dummy variation
    note: `Fallback link for ${material.name}`,
    created_at: knex.fn.now(),
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));

  if (supplierLinks.length > 0) {
    await knex('packaging_material_suppliers')
      .insert(supplierLinks)
      .onConflict(['packaging_material_id', 'supplier_id']) // use your unique constraint
      .ignore();

    console.log(
      `Inserted ${supplierLinks.length} packaging_material_suppliers (ignoring duplicates).`
    );
  } else {
    console.warn('No packaging materials found to link.');
  }
};
