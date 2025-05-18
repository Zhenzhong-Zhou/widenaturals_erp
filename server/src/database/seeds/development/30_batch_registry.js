const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('Seeding batch_registry from product_batches and packaging_material_batches...');
  
  const registeredBy = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  // Step 1: Seed from product_batches
  const existingProductBatchIds = await knex('batch_registry')
    .whereNotNull('product_batch_id')
    .pluck('product_batch_id');
  
  const productBatches = await knex('product_batches')
    .select('id')
    .whereNotIn('id', existingProductBatchIds);
  
  const productRows = productBatches.map((batch) => ({
    id: knex.raw('uuid_generate_v4()'),
    batch_type: 'product',
    product_batch_id: batch.id,
    packaging_material_batch_id: null,
    registered_by: registeredBy,
    registered_at: knex.fn.now(),
  }));
  
  // Step 2: Seed from packaging_material_batches
  const existingPMBatchIds = await knex('batch_registry')
    .whereNotNull('packaging_material_batch_id')
    .pluck('packaging_material_batch_id');
  
  const packagingMaterialBatches = await knex('packaging_material_batches')
    .select('id')
    .whereNotIn('id', existingPMBatchIds);
  
  const pmRows = packagingMaterialBatches.map((batch) => ({
    id: knex.raw('uuid_generate_v4()'),
    batch_type: 'packaging_material',
    product_batch_id: null,
    packaging_material_batch_id: batch.id,
    registered_by: registeredBy,
    registered_at: knex.fn.now(),
  }));
  
  const allRows = [...productRows, ...pmRows];
  
  if (!allRows.length) {
    console.log('All batches already registered. Skipping.');
    return;
  }
  
  await knex('batch_registry').insert(allRows);
  console.log(`Seeded ${productRows.length} product and ${pmRows.length} packaging material batches into batch_registry.`);
};
