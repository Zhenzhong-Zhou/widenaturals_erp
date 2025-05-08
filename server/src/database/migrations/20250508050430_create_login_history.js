/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('login_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('session_id').nullable().references('id').inTable('sessions');
    table.uuid('token_id').nullable().references('id').inTable('tokens');
    
    table.uuid('auth_action_type_id').notNullable().references('id').inTable('auth_action_types');
    
    table.enu('status', ['success', 'failure'], {
      useNative: true,
      enumName: 'login_status_type',
    }).notNullable();
    
    table.string('ip_address', 45).nullable(); // IPv6 compatible
    table.text('user_agent').nullable();
    table.timestamp('event_timestamp', { useTz: true }).defaultTo(knex.fn.now());
    
    table.index(['user_id', 'event_timestamp']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('login_history');
  await knex.raw('DROP TYPE IF EXISTS login_status_type');
};
