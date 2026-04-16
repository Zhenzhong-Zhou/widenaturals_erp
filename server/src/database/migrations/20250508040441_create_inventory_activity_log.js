/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('inventory_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('warehouse_inventory_id')
      .notNullable()
      .references('id')
      .inTable('warehouse_inventory');
    
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
    
    table.integer('previous_quantity').notNullable();
    table.integer('quantity_change').notNullable();
    table.integer('new_quantity').notNullable();
    
    table
      .uuid('status_id')
      .nullable()
      .references('id')
      .inTable('inventory_status');
    table
      .timestamp('status_effective_at', { useTz: true })
      .nullable();
    
    // Source linkage — polymorphic reference to what triggered this
    table.string('reference_type', 30).nullable();
    table.uuid('reference_id').nullable();
    
    table
      .uuid('performed_by')
      .notNullable()
      .references('id')
      .inTable('users');
    table.text('comments').nullable();
    table.text('checksum').notNullable();
    table.jsonb('metadata').nullable();
    
    table
      .timestamp('performed_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
  });
  
  await knex.raw(`
    ALTER TABLE inventory_activity_log
    ADD CONSTRAINT inventory_activity_log_quantity_integrity_check
      CHECK (new_quantity = previous_quantity + quantity_change),
    ADD CONSTRAINT inventory_activity_log_reference_check
      CHECK (
        (reference_type IS NULL AND reference_id IS NULL) OR
        (reference_type IS NOT NULL AND reference_id IS NOT NULL)
      ),
    ADD CONSTRAINT inventory_activity_log_reference_type_check
      CHECK (reference_type IS NULL OR reference_type IN (
        'order', 'transfer', 'audit', 'return', 'manual', 'fulfillment', 'adjustment'
      ));
  `);
  
  await knex.raw(`
    CREATE INDEX idx_inventory_activity_log_inventory_id
      ON inventory_activity_log (warehouse_inventory_id);
    CREATE INDEX idx_inventory_activity_log_action_type
      ON inventory_activity_log (inventory_action_type_id);
    CREATE INDEX idx_inventory_activity_log_performed_at
      ON inventory_activity_log (performed_at);
    CREATE INDEX idx_inventory_activity_log_reference
      ON inventory_activity_log (reference_type, reference_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_activity_log');
};
