/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('packaging_material_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('packaging_material_id')
      .notNullable()
      .references('id')
      .inTable('packaging_materials')
      .onDelete('RESTRICT');
    
    table.text('lot_number').notNullable();
    
    table.string('material_snapshot_name', 150); // internal name at receipt
    table.string('received_label_name', 150);    // supplier label name
    
    table.decimal('quantity', 12, 3).notNullable();
    table.string('unit', 20).notNullable(); // e.g., pcs, kg, m
    
    table.date('manufacture_date');
    table.date('expiry_date');
    
    table.timestamp('received_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('updated_at', { useTz: true });
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
    table.index(['packaging_material_id'], 'idx_packaging_batch_material');
    table.index(['lot_number'], 'idx_packaging_batch_lot');
  });
};

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('packaging_material_batches');
};
