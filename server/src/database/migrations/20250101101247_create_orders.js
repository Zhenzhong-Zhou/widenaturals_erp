/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('order_number', 100).unique().nullable();

    table
      .uuid('order_type_id')
      .notNullable()
      .references('id')
      .inTable('order_types');

    table
      .timestamp('order_date', { useTz: true })
      .notNullable();

    table
      .uuid('order_status_id')
      .notNullable()
      .references('id')
      .inTable('order_status');

    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.text('note').nullable();

    // Shipping Information (optional)
    table.uuid('shipping_address_id')
      .nullable()
      .references('id')
      .inTable('addresses');
    
    // Billing Information (optional)
    table.uuid('billing_address_id')
      .nullable()
      .references('id')
      .inTable('addresses');
    
    // Audit fields
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();

    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['order_type_id'], 'idx_orders_order_type');
    table.index(['order_status_id'], 'idx_orders_order_status');
    table.index(['created_at'], 'idx_orders_created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('orders');
};
