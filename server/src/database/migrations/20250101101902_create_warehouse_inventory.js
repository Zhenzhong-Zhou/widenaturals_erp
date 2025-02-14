/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_inventory', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses');
    table
      .uuid('inventory_id')
      .notNullable()
      .references('id')
      .inTable('inventory');

    table.integer('reserved_quantity').notNullable().defaultTo(0);
    table.integer('available_quantity').notNullable().defaultTo(0);
    table.decimal('warehouse_fee', 10, 2).notNullable().defaultTo(0);

    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('warehouse_lot_status')
      .index();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Unique constraint to prevent duplicate inventory records per warehouse
    table.unique(['warehouse_id', 'inventory_id']);
  });

  // Constraints for consistency
  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_reserved_check
    CHECK (reserved_quantity >= 0);
  `);

  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_available_check
    CHECK (available_quantity >= 0);
  `);

  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_stock_check
    CHECK (available_quantity + reserved_quantity >= 0);
  `);

  // Indexes for performance
  await knex.raw(`
    CREATE INDEX idx_warehouse_inventory_warehouse_inventory ON warehouse_inventory (warehouse_id, inventory_id);
    CREATE INDEX idx_warehouse_inventory_reserved_quantity ON warehouse_inventory (reserved_quantity);
    CREATE INDEX idx_warehouse_inventory_warehouse_lot_status ON warehouse_inventory (status_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory');
};
