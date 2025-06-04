/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('session_id').nullable().references('id').inTable('sessions');

    table.string('token_type', 30).notNullable(); // e.g., 'access', 'refresh', 'email_verification'
    table.text('token_hash').notNullable(); // Store hash only (never raw token)

    table.timestamp('issued_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);

    table.text('context').nullable(); // E.g., device info, reset request ID, etc.

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['user_id', 'token_type', 'is_revoked']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tokens');
};
