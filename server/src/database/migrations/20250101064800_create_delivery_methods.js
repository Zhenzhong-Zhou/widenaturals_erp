/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('delivery_methods', (table) => {
    table.uuid('id').primary();
    table.string('method_name', 100).unique().notNullable();
    table.text('description').nullable();
    table.specificType('estimated_time', 'INTERVAL').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('delivery_methods');
};
