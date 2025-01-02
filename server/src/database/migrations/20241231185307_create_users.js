/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email', 255).notNullable().unique().index();
    table.uuid('role_id').references('id').inTable('roles').index();
    table.string('firstname', 100).nullable();
    table.string('lastname', 100).nullable();
    table.string('phone_number', 15).unique().nullable();
    table.string('job_title', 100).nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.text('note').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
