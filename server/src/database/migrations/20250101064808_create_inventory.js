/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('inventory', (table) => {
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
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
 
  // Add unique constraint using knex.raw()
  await knex.raw(`
    ALTER TABLE inventory
    ADD CONSTRAINT inventory_unique_constraint UNIQUE (product_id, location_id, lot_number, expiry_date);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory');
};
