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
      .uuid('batch_id')
      .notNullable()
      .references('id')
      .inTable('batch_registry');

    table.integer('warehouse_quantity').notNullable().defaultTo(0);
    table.integer('reserved_quantity').notNullable().defaultTo(0);
    table.decimal('warehouse_fee', 10, 2).notNullable().defaultTo(0);

    table.timestamp('inbound_date', { useTz: true }).notNullable().index();
    table.timestamp('outbound_date', { useTz: true }).nullable().index();
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('inventory_status')
      .index();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Prevent duplicate records per warehouse/batch
    table.unique(['warehouse_id', 'batch_id']);
  });

  // Constraints for consistency
  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_warehouse_quantity_check
    CHECK (warehouse_quantity >= 0);
  `);

  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_reserved_check
    CHECK (reserved_quantity >= 0);
  `);

  await knex.raw(`
    ALTER TABLE warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_reserved_not_exceed_total_check
    CHECK (reserved_quantity <= warehouse_quantity);
  `);

  // Optimized indexes
  await knex.raw(`
    CREATE INDEX idx_warehouse_inventory_warehouse_batch ON warehouse_inventory (warehouse_id, batch_id);
    CREATE INDEX idx_warehouse_inventory_reserved_quantity ON warehouse_inventory (reserved_quantity);
    CREATE INDEX idx_warehouse_inventory_status_id ON warehouse_inventory (status_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory');
};
