/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('status_entity_types', table => {
    table.uuid('id').primary(); // Unique identifier for the record
    table.uuid('status_id').notNullable().references('id').inTable('status').index();
    table.uuid('entity_type_id').notNullable().references('id').inTable('entity_types').index();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.unique(['status_id', 'entity_type_id']); // Ensure combination is unique
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('status_entity_types');
};
