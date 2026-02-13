/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now()); // Login time
    table.timestamp('last_activity_at', { useTz: true }).notNullable().defaultTo(knex.fn.now()); // Updated per action
    table.timestamp('expires_at', { useTz: true }).notNullable();
  
    table.timestamp('revoked_at', { useTz: true }).nullable(); // Set when session is killed or expired
    table.timestamp('logout_at', { useTz: true }).nullable();

    table.string('ip_address', 45).nullable(); // IPv4 or IPv6
    table.text('user_agent').nullable();
    table.string('device_id').nullable(); // Optional per-device ID

    table.text('note').nullable();
    
    table.index(['user_id', 'expires_at', 'revoked_at']);
    table.index(['expires_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
