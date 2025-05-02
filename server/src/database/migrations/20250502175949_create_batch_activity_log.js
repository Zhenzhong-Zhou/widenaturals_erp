/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('product_batch_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('batch_id').notNullable().references('id').inTable('product_batches');
    
    table.string('action_type', 50).notNullable(); // e.g., status_change, quantity_correction, note_update
    table.jsonb('previous_value');
    table.jsonb('new_value');
    table.text('change_summary');
    
    table.uuid('changed_by').references('id').inTable('users');
    table.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.index(['batch_id'], 'idx_product_batch_activity_log_batch_id');
    table.index(['action_type'], 'idx_product_batch_activity_log_action');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_batch_activity_log');
};
