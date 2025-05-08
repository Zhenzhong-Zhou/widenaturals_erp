/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('audit_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Who performed the action
    table.uuid('user_id').notNullable().references('id').inTable('users');
    
    // What resource was affected (can be extended)
    table.string('table_name', 100).notNullable(); // e.g., 'products'
    table.uuid('record_id').nullable(); // ID of the affected record
    
    // What happened
    table.uuid('action_type_id').notNullable().references('id').inTable('audit_action_types');
    
    // Before/after states for auditing (optional but powerful)
    table.jsonb('previous_data').nullable();
    table.jsonb('new_data').nullable();
    
    // When and from where
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.text('comments').nullable();
    
    // Timestamp
    table.timestamp('logged_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.index(['user_id', 'table_name', 'logged_at'], 'idx_audit_log_user_table_time');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('audit_log');
    await knex.raw(`DROP TYPE IF EXISTS audit_action_type`);
  };
};
