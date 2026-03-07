/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('transfer_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('transfer_order_id')
      .notNullable()
      .references('id')
      .inTable('orders');

    // Batch-only identity
    table
      .uuid('batch_id')
      .notNullable()
      .references('id')
      .inTable('batch_registry');

    table.integer('quantity').notNullable();

    table.string('unit', 20).nullable();

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('transfer_order_item_status');

    // Audit metadata
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();

    table
      .timestamp('updated_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();

    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Prevent duplicate batch lines in same transfer
    table.unique(['transfer_order_id', 'batch_id'], {
      indexName: 'uq_transfer_order_batch',
    });

    // Indexes
    table.index(['transfer_order_id'], 'idx_transfer_order_id');
    table.index(['batch_id'], 'idx_transfer_batch_id');

    // Positive quantity enforcement
    table.check('quantity > 0');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('transfer_order_items');
};
