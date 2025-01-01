/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('pricing', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.uuid('price_type_id').notNullable().references('id').inTable('pricing_types');
    // table.uuid('batch_id').references('id').inTable('batch');
    table.uuid('location_id').references('id').inTable('locations');
    table.decimal('price', 10, 2).notNullable();
    table.timestamp('valid_from').notNullable();
    table.timestamp('valid_to').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pricing');
};
