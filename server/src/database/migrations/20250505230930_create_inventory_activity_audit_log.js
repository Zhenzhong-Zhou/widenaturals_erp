/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_activity_audit_log', (table) => {
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
      (warehouse_inventory_id IS NOT NULL AND location_inventory_id IS NULL)
      OR
      (warehouse_inventory_id IS NULL AND location_inventory_id IS NOT NULL)
    `);

    table
      .uuid('inventory_action_type_id')
      .notNullable()
      .references('id')
      .inTable('inventory_action_types');
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('inventory_status');
    table
      .timestamp('status_effective_at', { useTz: true })
      .defaultTo(knex.fn.now());

    table.uuid('action_by').notNullable().references('id').inTable('users');
    table.text('comments');
    table.text('checksum').notNullable();
    table.jsonb('metadata');

    table.timestamp('recorded_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('recorded_by').references('id').inTable('users');

    // Add this if needed:
    table.enu('inventory_scope', ['warehouse', 'location']).notNullable();

    table.unique(
      ['warehouse_inventory_id', 'inventory_action_type_id', 'recorded_at'],
      { indexName: 'uq_warehouse_inventory_action_recorded' }
    );
    table.unique(
      ['location_inventory_id', 'inventory_action_type_id', 'recorded_at'],
      { indexName: 'uq_location_inventory_action_recorded' }
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_activity_audit_log');
};
