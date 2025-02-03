/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('inventory', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products').index();
    // table.uuid('sku_id').references('id').inTable('skus').index(); // Optional SKU tracking
    table.uuid('warehouse_id').references('id').inTable('warehouses').index(); // New: Links to warehouse
    table.uuid('location_id').notNullable().references('id').inTable('locations').index();
    table.string('item_type', 50).notNullable();
    table.string('identifier', 100).unique().nullable();
    table.integer('quantity').notNullable().checkPositive();
    table.date('manufacture_date').nullable();
    table.date('expiry_date').nullable();
    table.timestamp('inbound_date', { useTz: true }).notNullable().index();
    table.timestamp('outbound_date', { useTz: true }).nullable().index();
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('status_id').notNullable().references('id').inTable('status').index();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()).index();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).index();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
  
  // Unique constraint
  //  todo later ADD CONSTRAINT inventory_unique_constraint UNIQUE (product_id, location_id, sku_id, expiry_date);
  await knex.raw(`
    ALTER TABLE inventory
    ADD CONSTRAINT inventory_unique_constraint UNIQUE (product_id, location_id, expiry_date);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory');
};
