/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_allocations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Inventory & Warehouse Info
    // table
    //   .uuid('inventory_id')
    //   .notNullable()
    //   .references('id')
    //   .inTable('inventory');
    table
      .uuid('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses');
    // table
    //   .uuid('lot_id')
    //   .references('id')
    //   .inTable('warehouse_inventory_lots')
    //   .nullable();

    // Allocation Details
    table.integer('allocated_quantity').notNullable().checkPositive();
    table
      .uuid('status_id')
      .references('id')
      .inTable('inventory_allocation_status')
      .notNullable();

    table.timestamp('allocated_at').defaultTo(knex.fn.now());

    // Linked to Orders or Transfers
    table.uuid('order_id').references('id').inTable('sales_orders').nullable();
    table
      .uuid('transfer_id')
      .references('id')
      .inTable('inventory_transfers')
      .nullable();

    // Tracking and Metadata
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique Constraint to prevent duplicate allocation entries
    // table.unique(['order_id', 'lot_id', 'inventory_id', 'warehouse_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_allocations');
};
