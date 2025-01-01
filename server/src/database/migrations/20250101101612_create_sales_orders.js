/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('sales_orders');
  if (!exists) {
    return knex.schema.createTable('sales_orders', (table) => {
      table.uuid('id').primary();
      table.uuid('customer_id').notNullable().references('id').inTable('customers');
      table.date('order_date').notNullable();
      table.json('items').notNullable();
      table.uuid('discount_id').references('id').inTable('pricing');
      table.decimal('discount_amount', 10, 2);
      table.decimal('subtotal', 10, 2).notNullable();
      table.decimal('tax', 10, 2);
      table.decimal('shipping_fee', 10, 2);
      table.decimal('total_amount', 10, 2).notNullable();
      table.uuid('tracking_number_id').references('id').inTable('tracking_numbers');
      table.uuid('delivery_method_id').references('id').inTable('delivery_methods');
      table.uuid('status_id').notNullable().references('id').inTable('status');
      table.timestamp('status_date').defaultTo(knex.fn.now());
      table.text('note');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('updated_by').references('id').inTable('users');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sales_orders');
};
