/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('token_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('token_id').nullable().references('id').inTable('tokens');
    
    table.enu('event_type', [
      'generate',
      'refresh',
      'revoke',
      'verify',
      'invalid',
      'expired',
    ], {
      useNative: true,
      enumName: 'token_event_type',
    }).notNullable();
    
    table.enu('status', ['success', 'failure'], {
      useNative: true,
      enumName: 'token_event_status',
    }).notNullable();
    
    table.string('token_type', 20).notNullable(); // 'access' | 'refresh' | 'magic_link' etc.
    
    table.timestamp('event_at', { useTz: true }).defaultTo(knex.fn.now());
    
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.text('comments').nullable();
    table.jsonb('metadata').nullable();
    
    // Indexes
    table.index(['user_id', 'token_type', 'event_at'], 'idx_token_activity_user_event');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('token_activity_log');
  await knex.raw('DROP TYPE IF EXISTS token_event_type');
  await knex.raw('DROP TYPE IF EXISTS token_event_status');
};
