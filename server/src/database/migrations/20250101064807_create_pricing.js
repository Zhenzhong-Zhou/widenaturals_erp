/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('pricing', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table
      .uuid('price_type_id')
      .notNullable()
      .references('id')
      .inTable('pricing_types');
    // table.uuid('batch_id').references('id').inTable('batch');
    table.uuid('location_id').references('id').inTable('locations');
    table.decimal('price', 10, 2).notNullable();
    table.timestamp('valid_from', { useTz: true }).notNullable();
    table.timestamp('valid_to', { useTz: true }).nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
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
  return knex.schema.dropTableIfExists('pricing');
};
