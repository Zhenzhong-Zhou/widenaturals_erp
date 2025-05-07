/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('location_inventory_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('location_inventory_id').notNullable().references('id').inTable('location_inventory');
    table.uuid('inventory_action_type_id').notNullable().references('id').inTable('inventory_action_types');
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();
    table.uuid('status_id').notNullable().references('id').inTable('inventory_status');
    table.timestamp('status_effective_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('timestamp', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('action_by').references('id').inTable('users').notNullable();
    table.text('comments');
    table.text('checksum').notNullable();
    table.json('metadata');
    
    table.timestamp('recorded_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('recorded_by').references('id').inTable('users');

    // Indexes
    table.index(['location_inventory_id', 'timestamp'], 'idx_loc_inv_hist_timestamp');
    
    table.unique(
      ['location_inventory_id', 'inventory_action_type_id', 'timestamp'],
      'uq_location_inventory_history_dedupe'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('location_inventory_history');
};
