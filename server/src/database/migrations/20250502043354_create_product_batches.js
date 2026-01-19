/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('lot_number', 100).notNullable(); // e.g. "LOT20240501-01"
    table.uuid('sku_id').notNullable().references('id').inTable('skus');
    table.uuid('manufacturer_id').references('id').inTable('manufacturers');

    table.date('manufacture_date').notNullable();
    table.date('expiry_date').notNullable();
    table.date('received_date'); // e.g., first warehouse receipt date
    table.integer('initial_quantity').notNullable(); // Original manufactured amount

    table.text('notes'); // QA remarks, custom info

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('batch_status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('released_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('released_by').nullable().references('id').inTable('users');
    table
      .uuid('released_by_manufacturer_id')
      .nullable()
      .references('id')
      .inTable('manufacturers');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');

    table.index(['lot_number', 'sku_id'], 'idx_batches_batch_sku');
    table.index(['status_id', 'expiry_date'], 'idx_product_batches_status');
    table.unique(['lot_number', 'sku_id'], {
      indexName: 'uq_batch_per_sku',
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_batches');
};
