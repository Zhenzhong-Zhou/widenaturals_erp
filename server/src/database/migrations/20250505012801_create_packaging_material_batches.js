/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('packaging_material_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('packaging_material_supplier_id')
      .notNullable()
      .references('id')
      .inTable('packaging_material_suppliers');

    table.text('lot_number').notNullable();

    table.string('material_snapshot_name', 150); // internal name at receipt
    table.string('received_label_name', 150); // supplier label name

    table.decimal('quantity', 12, 3).notNullable();
    table.string('unit', 20).notNullable(); // e.g., pcs, kg, m

    table.date('manufacture_date');
    table.date('expiry_date');

    table.decimal('unit_cost', 12, 4);
    table.string('currency', 5); // 'CAD', 'USD', etc.
    table.decimal('exchange_rate', 12, 6); // optional if multi-currency
    table.decimal('total_cost', 14, 4); // optional convenience (quantity × unit_cost)

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('batch_status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('received_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('received_by').references('id').inTable('users');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at', { useTz: true });
    table.uuid('updated_by').references('id').inTable('users');

    table.index(
      ['packaging_material_supplier_id'],
      'idx_packaging_material_suppliers'
    );
    table.index(['lot_number'], 'idx_packaging_batch_lot');

    table.unique(['packaging_material_supplier_id', 'lot_number'], {
      indexName: 'uq_material_batch_lot_per_supplier',
    });
  });
};

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('packaging_material_batches');
};
