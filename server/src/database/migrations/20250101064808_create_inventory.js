/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').references('id').inTable('products');
    table.uuid('location_id').references('id').inTable('locations');
    table.string('item_type', 50).notNullable();
    table.string('lot_number', 100).nullable();
    table.string('identifier', 100).unique().nullable();
    table.integer('quantity').notNullable();
    table.date('manufacture_date').nullable();
    table.date('expiry_date').nullable();
    table.decimal('warehouse_fee', 10, 2).nullable();
    table.timestamp('inbound_date', { useTz: true }).notNullable();
    table.timestamp('outbound_date', { useTz: true }).nullable();
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());
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
  return knex.schema.dropTableIfExists('inventory');
};
