/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('inventory_allocations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Allocation Target: Sales or Transfer
    table
      .uuid('order_item_id')
      .nullable()
      .references('id')
      .inTable('order_items');
    table
      .uuid('transfer_order_item_id')
      .nullable()
      .references('id')
      .inTable('transfer_order_items');

    // Location & Batch
    table
      .uuid('location_id')
      .notNullable()
      .references('id')
      .inTable('locations');
    table
      .uuid('batch_id')
      .notNullable()
      .references('id')
      .inTable('batch_registry');

    // Allocation Details
    table.integer('allocated_quantity').notNullable().checkPositive();
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('inventory_allocation_status');
    table.timestamp('allocated_at').defaultTo(knex.fn.now());

    // Metadata
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index(['order_item_id'], 'idx_alloc_order_item');
    table.index(['transfer_order_item_id'], 'idx_alloc_transfer_item');
    table.index(['batch_id'], 'idx_alloc_batch');
    table.index(['location_id'], 'idx_alloc_location');
  });

  // Constraints
  await knex.raw(`
    ALTER TABLE inventory_allocations
    ADD COLUMN target_item_id UUID GENERATED ALWAYS AS (
      COALESCE(order_item_id, transfer_order_item_id)
    ) STORED;
  `);

  await knex.raw(`
    ALTER TABLE inventory_allocations
    ADD CONSTRAINT uniq_alloc_batch_item_location
    UNIQUE (target_item_id, batch_id, location_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_allocations');
};
