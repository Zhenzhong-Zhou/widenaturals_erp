/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('tracking_numbers', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').references('id').inTable('orders');
    table.string('tracking_number', 255).unique().notNullable();
    table
      .string('carrier', 100)
      .notNullable()
      .checkIn(['UPS', 'Canada Post', 'FedEx', 'DHL', 'Purolator']);
    table.string('service_name', 100).nullable();
    table.date('shipped_date').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table
      .uuid('delivery_method_id')
      .references('id')
      .inTable('delivery_methods');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
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
  return knex.schema.dropTableIfExists('tracking_numbers');
};
