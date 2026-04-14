/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_movements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('warehouse_inventory_id')
      .notNullable()
      .references('id')
      .inTable('warehouse_inventory');
    
    table.string('movement_type', 30).notNullable();
    table.string('from_zone_code', 100).nullable();
    table.string('to_zone_code', 100).nullable();
    table.integer('quantity').notNullable();
    
    table.string('reference_type', 30).nullable();
    table.uuid('reference_id').nullable();
    
    table.text('notes').nullable();
    
    table
      .uuid('performed_by')
      .notNullable()
      .references('id')
      .inTable('users');
    table
      .timestamp('performed_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
  });
  
  await knex.raw(`
    ALTER TABLE warehouse_movements
    ADD CONSTRAINT warehouse_movements_type_check
      CHECK (movement_type IN (
        'zone_transfer', 'pick', 'restock',
        'pallet_split', 'pallet_consolidate', 'adjustment'
      )),
    ADD CONSTRAINT warehouse_movements_reference_type_check
      CHECK (reference_type IS NULL OR reference_type IN (
        'order', 'audit', 'manual', 'return'
      )),
    ADD CONSTRAINT warehouse_movements_quantity_check
      CHECK (quantity > 0);
  `);
  
  await knex.raw(`
    CREATE INDEX idx_warehouse_movements_inventory_id
      ON warehouse_movements (warehouse_inventory_id);
    CREATE INDEX idx_warehouse_movements_type
      ON warehouse_movements (movement_type);
    CREATE INDEX idx_warehouse_movements_performed_at
      ON warehouse_movements (performed_at);
    CREATE INDEX idx_warehouse_movements_reference
      ON warehouse_movements (reference_type, reference_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_movements');
};
