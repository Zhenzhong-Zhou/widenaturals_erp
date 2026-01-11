/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('user_auth', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .unique();
    table.text('password_hash').notNullable();
    table.integer('attempts').defaultTo(0);
    table.integer('failed_attempts').defaultTo(0);
    table.timestamp('lockout_time', { useTz: true }).nullable();
    table.timestamp('last_login', { useTz: true }).nullable();
    table.jsonb('metadata').nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table
      .timestamp('last_changed_at', { useTz: true })
      .defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('user_auth');
};
