/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_inventory_adjustments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Foreign Keys
    table.uuid('warehouse_inventory_id').notNullable().references('id').inTable('warehouse_inventory');
    table.uuid('order_id').nullable().references('id').inTable('orders');
    table.uuid('adjustment_type_id').notNullable().references('id').inTable('lot_adjustment_types');

    table.integer('previous_quantity').notNullable();
    table.integer('adjusted_quantity').notNullable();
    table.integer('new_quantity').notNullable();

    table.uuid('status_id').references('id').inTable('inventory_status');
    
    table.timestamp('adjustment_date', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('adjusted_by').notNullable().references('id').inTable('users');
    table.text('comments').nullable();

    // Constraints
    table.check('new_quantity >= 0'); // Ensures stock never goes negative
    table.check('adjusted_quantity <> 0'); // Prevents zero adjustments

    // Unique constraint to prevent duplicate adjustments at the same timestamp
    table.unique(['warehouse_inventory_id', 'adjustment_type_id', 'adjustment_date'], { indexName: 'uq_inventory_adjustment_once_per_time'});
    
    // Index for better performance
    table.index(['warehouse_inventory_id'], 'idx_warehouse_inventory_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory_adjustments');
};
