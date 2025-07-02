/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('customers', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('firstname', 100).notNullable();
    table.string('lastname', 100).notNullable();
    table.string('email', 255).notNullable().unique().index();
    table.string('phone_number', 15).unique().nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.text('note').nullable();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['email', 'phone_number']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customers');
};
