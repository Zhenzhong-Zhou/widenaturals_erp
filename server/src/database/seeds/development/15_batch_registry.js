const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('Seeding batch_registry from product_batches...');
  
  const registeredBy = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const existingBatchIds = await knex('batch_registry')
    .whereNotNull('product_batch_id')
    .pluck('product_batch_id');
  
  const productBatches = await knex('product_batches')
    .select('id')
    .whereNotIn('id', existingBatchIds);
  
  if (!productBatches.length) {
    console.log('All product batches already registered. Skipping.');
    return;
  }
  
  const rows = productBatches.map((batch) => ({
    id: knex.raw('uuid_generate_v4()'),
    batch_type: 'product',
    product_batch_id: batch.id,
    packaging_material_batch_id: null,
    registered_by: registeredBy,
    registered_at: knex.fn.now(),
  }));
  
  await knex('batch_registry').insert(rows);
  
  console.log(`Seeded ${rows.length} new batch_registry records from product_batches.`);
};
