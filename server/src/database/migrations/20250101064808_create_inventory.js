/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('inventory', (table) => {
    table.uuid('id').primary();
    table.uuid('product_id').references('id').inTable('products').index();
    table.uuid('location_id').references('id').inTable('locations').index();
    table.string('item_type', 50).notNullable();
    table.string('lot_number', 100).nullable().index();
    table.string('identifier', 100).unique().nullable();
    table.integer('quantity').notNullable();
    table.date('manufacture_date').nullable();
    table.date('expiry_date').nullable();
    table.decimal('warehouse_fee', 10, 2).nullable();
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
  
  // Add unique constraint
  await knex.raw(`
    ALTER TABLE inventory
    ADD CONSTRAINT inventory_unique_constraint UNIQUE (product_id, location_id, lot_number, expiry_date);
  `);

// Add composite indexes
  await knex.raw(`
    CREATE INDEX idx_inventory_location_created ON inventory (location_id, created_at);
    CREATE INDEX idx_inventory_status_date ON inventory (status_date);
    CREATE INDEX idx_inventory_inbound_date ON inventory (inbound_date);
    CREATE INDEX idx_inventory_outbound_date ON inventory (outbound_date);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory');
};
