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
      .defaultTo(knex.fn.now())
      .notNullable();

    table
      .uuid('order_status_id')
      .notNullable()
      .references('id')
      .inTable('order_status');

    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable();
    table.text('note').nullable();

    // Shipping Information (optional)
    table.boolean('has_shipping_address').defaultTo(false);
    table.string('shipping_fullname', 150).nullable();
    table.string('shipping_phone', 20).nullable();
    table.string('shipping_email', 150).nullable(); // optional for tracking/notifications

    table.string('shipping_address_line1', 255).nullable();
    table.string('shipping_address_line2', 255).nullable();
    table.string('shipping_city', 100).nullable();
    table.string('shipping_state', 100).nullable();
    table.string('shipping_postal_code', 20).nullable();
    table.string('shipping_country', 100).nullable(); // usually 'Canada', 'US', etc.
    table.string('shipping_region', 100).nullable(); // e.g., Alberta, California, Guangdong

    // Audit fields
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();

    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('orders');
};
