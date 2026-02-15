/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(
    'packaging_material_batch_activity_logs',
    (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table
        .uuid('packaging_material_batch_id')
        .notNullable()
        .references('id')
        .inTable('packaging_material_batches');

      table
        .uuid('batch_activity_type_id')
        .notNullable()
        .references('id')
        .inTable('batch_activity_types');

      table.jsonb('previous_value');
      table.jsonb('new_value');
      table.text('change_summary');

      table.uuid('changed_by').references('id').inTable('users');
      table.timestamp('changed_at', { useTz: true }).defaultTo(knex.fn.now());

      table.index(
        ['packaging_material_batch_id'],
        'idx_packaging_material_batch_activity_log_batch_id'
      );

      table.index(
        ['batch_activity_type_id'],
        'idx_packaging_material_batch_activity_log_activity_type'
      );
    }
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('packaging_material_batch_activity_logs');
};
