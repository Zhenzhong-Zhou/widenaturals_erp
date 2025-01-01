/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary();
    table.uuid('location_type_id').references('id').inTable('location_types');
    table.string('name', 100).unique().notNullable();
    table.text('address');
    table.decimal('warehouse_fee', 10, 2);
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Indexes
    table.index(['name', 'location_type_id'], 'idx_locations_name_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('locations');
};
