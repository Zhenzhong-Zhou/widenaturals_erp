/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary();
    table.string('firstname', 100).notNullable();
    table.string('lastname', 100).notNullable();
    table
      .string('email', 255)
      .unique()
      .nullable()
      .checkRegex('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    table
      .string('phone_number', 15)
      .unique()
      .nullable()
      .checkRegex('^\(\d{3}\)-\d{3}-\d{4}$');
    table.text('address').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.text('note').nullable();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('customers');
};
