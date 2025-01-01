/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable().references('id').inTable('sales_orders');
    table.uuid('inventory_id').notNullable().references('id').inTable('inventory');
    table.integer('quantity_ordered').notNullable();
    table.integer('quantity_fulfilled').defaultTo(0);
    table.uuid('price_id').notNullable().references('id').inTable('pricing');
    table.decimal('price', 10, 2).notNullable();
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
  return knex.schema.dropTableIfExists('order_items');
};
