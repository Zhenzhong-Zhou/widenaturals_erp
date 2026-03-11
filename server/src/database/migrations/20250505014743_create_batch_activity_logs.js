/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('batch_activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('batch_registry_id')
      .notNullable()
      .references('id')
      .inTable('batch_registry');
    
    table
      .enu('batch_type', ['product', 'packaging_material'], {
        useNative: true,
        existingType: true,
        enumName: 'batch_type_enum',
      })
      .notNullable();
    
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
    
    table.index(['batch_registry_id'], 'idx_batch_activity_log_batch');
    table.index(
      ['batch_activity_type_id'],
      'idx_batch_activity_log_activity_type'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('batch_activity_logs');
};
