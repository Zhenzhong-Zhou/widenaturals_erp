/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Either warehouse or location inventory
    table
      .uuid('warehouse_inventory_id')
      .nullable()
      .references('id')
      .inTable('warehouse_inventory');
    table
      .uuid('location_inventory_id')
      .nullable()
      .references('id')
      .inTable('location_inventory');
    table.check(`
      (warehouse_inventory_id IS NOT NULL AND location_inventory_id IS NULL) OR
      (warehouse_inventory_id IS NULL AND location_inventory_id IS NOT NULL)
    `);

    // Action metadata
    table
      .uuid('inventory_action_type_id')
      .notNullable()
      .references('id')
      .inTable('inventory_action_types');
    table
      .uuid('adjustment_type_id')
      .nullable()
      .references('id')
      .inTable('lot_adjustment_types');
    table.uuid('order_id').nullable().references('id').inTable('orders');
    table
      .uuid('status_id')
      .nullable()
      .references('id')
      .inTable('inventory_status');

    // Quantities
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();

    // Performed by
    table.uuid('performed_by').notNullable().references('id').inTable('users');

    // Optional metadata
    table.text('comments').nullable();
    table.jsonb('metadata').nullable();

    // Source linkage (optional, extensible)
    table.string('source_type').nullable(); // e.g., 'transfer', 'sale', etc.
    table.uuid('source_ref_id').nullable();

    // Timestamp
    table
      .timestamp('action_timestamp', { useTz: true })
      .defaultTo(knex.fn.now());

    // Indexes
    table.index(
      ['warehouse_inventory_id', 'inventory_action_type_id'],
      'idx_inventory_activity_wh'
    );
    table.index(
      ['location_inventory_id', 'inventory_action_type_id'],
      'idx_inventory_activity_loc'
    );

    table.unique(
      [
        'warehouse_inventory_id',
        'location_inventory_id',
        'inventory_action_type_id',
        'action_timestamp',
      ],
      { indexName: 'uq_inventory_log_insert_once' }
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_activity_log');
};
