/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('compliances', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').references('id').inTable('products');
    table.string('type', 100).notNullable();
    table.string('compliance_id', 100).notNullable();
    table.date('issued_date');
    table.date('expiry_date');
    table.text('description');
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(['product_id', 'type'], 'idx_compliances_product_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliances');
};
