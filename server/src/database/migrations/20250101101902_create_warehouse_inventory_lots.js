/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_inventory_lots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    // table.uuid('sku_id').nullable().references('id').inTable('skus'); // New: SKU tracking
    table.string('lot_number', 100).notNullable();
    table.string('batch_reference', 100).nullable(); // New: Batch tracking
    table.integer('quantity').notNullable().checkPositive();
    table.date('manufacture_date').nullable();
    table.date('expiry_date').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Unique constraint
    // table.unique(['warehouse_id', 'product_id', 'sku_id', 'lot_number']);
    table.unique(['warehouse_id', 'product_id', 'lot_number']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
