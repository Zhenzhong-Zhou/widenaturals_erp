/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('status', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary(); // Primary key with UUID
    table.string('name', 50).notNullable().unique().index(); // Name column with index for faster lookups
    table.text('description').nullable(); // Optional description
    table.boolean('is_active').defaultTo(true).index(); // Boolean column with index
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Auto-set on creation
    table.timestamp('updated_at').defaultTo(knex.fn.now()); // Auto-set on creation
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('status');
};
