/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');

    table.text('session_token_hash').notNullable(); // Store hash only
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Login time
    table.timestamp('last_activity_at').defaultTo(knex.fn.now()); // Updated per action
    table.timestamp('revoked_at').nullable(); // Set when session is killed or expired

    table.string('ip_address', 45).nullable(); // IPv4 or IPv6
    table.text('user_agent').nullable();
    table.string('device_id').nullable(); // Optional per-device ID

    table.timestamp('login_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('logout_at', { useTz: true }).nullable();
    table.boolean('is_active').defaultTo(true);

    table.text('note').nullable();

    table.index(['user_id', 'is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sessions');
};
