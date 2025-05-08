/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Links to current warehouse inventory record
    table.uuid('warehouse_inventory_id').notNullable().references('id').inTable('warehouse_inventory');
    
    // Type of inventory action (e.g., adjustment, sale, allocation)
    table.uuid('inventory_action_type_id').notNullable().references('id').inTable('inventory_action_types');
    
    // Type of adjustment if applicable (e.g., damaged, lost)
    table.uuid('adjustment_type_id').nullable().references('id').inTable('lot_adjustment_types');
    
    // Optional order linkage
    table.uuid('order_id').nullable().references('id').inTable('orders');
    
    // Quantities
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();
    
    // Who performed the activity
    table.uuid('performed_by').notNullable().references('id').inTable('users');
    
    // Optional comments and metadata
    table.text('comments').nullable();
    table.jsonb('metadata').nullable();
    
    // Timestamps
    table.timestamp('recorded_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Indexes for fast filtering
    table.index(['warehouse_inventory_id', 'inventory_action_type_id'], 'idx_inventory_activity_filters');
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_activity_log');
};
