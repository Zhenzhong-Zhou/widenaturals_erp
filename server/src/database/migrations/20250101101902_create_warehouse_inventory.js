/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_inventory', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.integer('reserved_quantity').notNullable().defaultTo(0).checkPositive(); // New: Tracks reserved stock
    table.decimal('warehouse_fee', 10, 2).notNullable().defaultTo(0);
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Unique constraint
    table.unique(['warehouse_id', 'product_id']);
  });
  
  // Indexes for performance
  await knex.raw(`
    CREATE INDEX idx_warehouse_inventory_warehouse_product ON warehouse_inventory (warehouse_id, product_id);
    CREATE INDEX idx_warehouse_inventory_reserved_quantity ON warehouse_inventory (reserved_quantity);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory');
};
