/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('sales_orders');
  if (!exists) {
    return knex.schema.createTable('sales_orders', (table) => {
      table.uuid('id').primary().references('id').inTable('orders');
      table
        .uuid('customer_id')
        .notNullable()
        .references('id')
        .inTable('customers');
      table.date('order_date').notNullable();
      table
        .uuid('payment_status_id')
        .references('id')
        .inTable('payment_status');
      table
        .uuid('payment_method_id')
        .references('id')
        .inTable('payment_methods');
      table.string('currency_code', 3).defaultTo('CAD');
      table.decimal('exchange_rate', 10, 4).nullable();
      table.decimal('base_currency_amount', 10, 2).nullable(); // amount in CAD, for example
      table
        .uuid('discount_id')
        .nullable()
        .references('id')
        .inTable('discounts');
      table.decimal('discount_amount', 10, 2);
      table.decimal('subtotal', 10, 2).notNullable();
      table
        .uuid('tax_rate_id')
        .notNullable()
        .references('id')
        .inTable('tax_rates'); // Ensure tax rate consistency

      table.decimal('tax_amount', 10, 2).defaultTo(0.0);
      table.decimal('shipping_fee', 10, 2);
      table.decimal('total_amount', 10, 2).notNullable();
      table
        .uuid('delivery_method_id')
        .notNullable()
        .references('id')
        .inTable('delivery_methods');
      table.jsonb('metadata').nullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
      table.uuid('created_by').references('id').inTable('users');
      table.uuid('updated_by').references('id').inTable('users');

      table.index('delivery_method_id');
      table.index(['customer_id', 'tax_rate_id']);
      table.index('payment_status_id');
      table.index('payment_method_id');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('sales_orders');
};
