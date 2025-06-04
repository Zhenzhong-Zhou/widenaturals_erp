/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging_material_batches...');

  const systemUserId = await knex('users')
    .select('id')
    .whereILike('email', 'system@internal.local')
    .first()
    .then((row) => row?.id);

  const activeBatchStatusId = await knex('batch_status')
    .select('id')
    .whereILike('name', 'active')
    .first()
    .then((row) => row?.id);

  const supplierLinks = await knex('packaging_material_suppliers')
    .select('id')
    .whereIn(
      'supplier_id',
      knex('suppliers').select('id').whereILike('name', 'Unspecified Supplier')
    );

  if (!supplierLinks.length) {
    console.warn('No supplier links found for Unspecified Supplier.');
    return;
  }

  const batches = supplierLinks.map((link, index) => {
    const lotNumber = `PMB-LOT-${1000 + index}`;

    return {
      id: knex.raw('uuid_generate_v4()'),
      packaging_material_supplier_id: link.id,
      lot_number: lotNumber,
      material_snapshot_name: `Snapshot Material ${index + 1}`,
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
      .onConflict(['packaging_material_supplier_id', 'lot_number']) // ensure this matches your unique constraint
      .ignore();

    console.log(
      `Attempted to insert ${batches.length} packaging_material_batches (duplicates ignored).`
    );
  }

  console.log(`Inserted ${batches.length} packaging_material_batches.`);
};
