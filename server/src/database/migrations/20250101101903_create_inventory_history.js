/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_history', (table) => {
    table.uuid('id').primary().primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('inventory_id')
      .notNullable()
      .references('id')
      .inTable('inventory');
    table
      .uuid('inventory_action_type_id')
      .notNullable()
      .references('id')
      .inTable('inventory_action_types');
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();
    table.uuid('status_id').notNullable().references('id').inTable('warehouse_lot_status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now());
    table
      .uuid('source_action_id')
      .references('id')
      .inTable('users')
      .notNullable();
    table.text('comments');
    table.text('checksum').notNullable();
    table.json('metadata');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');

    // Indexes
    table.index(
      ['inventory_id', 'timestamp'],
      'idx_inventory_history_inventory_timestamp'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_history');
};
