/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_batch_activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('batch_id')
      .notNullable()
      .references('id')
      .inTable('product_batches');

    table
      .uuid('lot_adjustment_type_id')
      .notNullable()
      .references('id')
      .inTable('lot_adjustment_types');
    table.jsonb('previous_value');
    table.jsonb('new_value');
    table.text('change_summary');

    table.uuid('changed_by').references('id').inTable('users');
    table.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['batch_id'], 'idx_product_batch_activity_log_batch_id');
    table.index(
      ['lot_adjustment_type_id'],
      'idx_product_batch_activity_log_action'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_batch_activity_logs');
};
