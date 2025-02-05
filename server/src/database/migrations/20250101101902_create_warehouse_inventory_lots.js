/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_inventory_lots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    // table.uuid('sku_id').nullable().references('id').inTable('skus'); // New: SKU tracking
    table.string('lot_number', 100).notNullable();
    // table.string('batch_reference', 100).nullable(); // Optional Batch tracking
    table.integer('quantity').notNullable().checkPositive();
    table.date('manufacture_date').nullable();
    table.date('expiry_date').nullable();
    table.timestamp('inbound_date', { useTz: true }).defaultTo(knex.fn.now()).index(); // Actual batch arrival date
    table.timestamp('outbound_date', { useTz: true }).nullable().index(); // Actual batch departure date
    table.uuid('status_id').notNullable().references('id').inTable('status').index();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).index();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Unique constraint to prevent duplicate lot records for the same warehouse and product
    table.unique(['warehouse_id', 'product_id', 'lot_number']);
  });
  
  // Add composite indexes for optimized queries
  await knex.raw(`
    CREATE INDEX idx_warehouse_inventory_lots_warehouse_product ON warehouse_inventory_lots (warehouse_id, product_id);
    CREATE INDEX idx_warehouse_inventory_lots_lot_number ON warehouse_inventory_lots (lot_number);
    CREATE INDEX idx_warehouse_inventory_lots_expiry_date ON warehouse_inventory_lots (expiry_date);
    CREATE INDEX idx_warehouse_inventory_lots_inbound_date ON warehouse_inventory_lots (inbound_date);
    CREATE INDEX idx_warehouse_inventory_lots_outbound_date ON warehouse_inventory_lots (outbound_date);
    CREATE INDEX idx_warehouse_inventory_lots_status ON warehouse_inventory_lots (status_id);
  `);
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory_lots');
};
