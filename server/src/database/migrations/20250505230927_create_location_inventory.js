/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('location_inventory', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('batch_id')
      .nullable()
      .references('id')
      .inTable('batch_registry')
      .index();
    table
      .uuid('location_id')
      .notNullable()
      .references('id')
      .inTable('locations')
      .index();

    table.integer('location_quantity').notNullable().defaultTo(0);
    table.integer('reserved_quantity').notNullable().defaultTo(0);

    table.timestamp('inbound_date', { useTz: true }).notNullable().index();
    table.timestamp('outbound_date', { useTz: true }).nullable().index();
    table.timestamp('last_update', { useTz: true }).defaultTo(knex.fn.now());

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('inventory_status')
      .index();
    table
      .timestamp('status_date', { useTz: true })
      .defaultTo(knex.fn.now())
      .index();
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['location_id', 'batch_id']);
  });

  await knex.raw(`
    ALTER TABLE location_inventory
    ADD CONSTRAINT inventory_location_quantity_check CHECK (location_quantity >= 0);
  `);

  await knex.raw(`
    ALTER TABLE location_inventory
    ADD CONSTRAINT inventory_reserved_quantity_check CHECK (reserved_quantity >= 0);
  `);

  // Optimized Indexes for Query Performance
  await knex.raw(`
    CREATE INDEX idx_location_inventory_location_batch ON location_inventory (location_id, batch_id);
    CREATE INDEX idx_location_inventory_inbound_date ON location_inventory (inbound_date);
    CREATE INDEX idx_location_inventory_outbound_date ON location_inventory (outbound_date);
    CREATE INDEX idx_location_inventory_warehouse_lot_status ON location_inventory (status_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('location_inventory');
};
