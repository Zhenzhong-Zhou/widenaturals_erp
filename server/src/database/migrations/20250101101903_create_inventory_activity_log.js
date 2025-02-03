/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_activity_log', (table) => {
    table.uuid('id').primary();
    table
      .uuid('inventory_id')
      .notNullable()
      .references('id')
      .inTable('inventory');
    table
      .uuid('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses');
    table
      .uuid('lot_id')
      .references('id')
      .inTable('warehouse_inventory_lots');
    table
      .uuid('inventory_action_type_id')
      .notNullable()
      .references('id')
      .inTable('inventory_action_types');
    table.integer('quantity_change').notNullable();
    table.integer('previous_quantity').notNullable();
    table.integer('new_quantity').notNullable();
    table
      .uuid('order_id')
  .references('id')
      .inTable('orders')
      .nullable();
    // table
    //   .uuid('transaction_id')
    //   .references('id')
    //   .inTable('transactions')
    //   .nullable();
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now());
    table.text('comments').nullable();
    table.json('metadata').nullable();
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_activity_log');
};
