/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('entity_types', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary(); // Primary key with UUID
    table.string('name', 50).notNullable().unique().index(); // Unique name with an index
    table.text('description').nullable(); // Optional description
    table.timestamp('status_date').defaultTo(knex.fn.now()); // Status date
    table.timestamp('created_at').defaultTo(knex.fn.now()); // Creation timestamp
    table.timestamp('updated_at').defaultTo(knex.fn.now()); // Update timestamp
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('entity_types');
};
