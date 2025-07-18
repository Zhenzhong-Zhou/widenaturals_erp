/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('code', 50).notNullable().unique();
    table
      .uuid('location_id')
      .notNullable()
      .references('id')
      .inTable('locations');
    table.integer('storage_capacity').nullable().checkPositive();
    table.decimal('default_fee', 10, 2).nullable().checkPositive();
    table.uuid('type_id').references('id').inTable('warehouse_types');
    table.boolean('is_archived').notNullable().defaultTo(false);
    table.text('notes');

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Enforce unique warehouse names per location
    table.unique(['name', 'location_id']);
  });

  await knex.raw(`
    ALTER TABLE warehouses
    ADD CONSTRAINT check_positive_storage_capacity CHECK (storage_capacity IS NULL OR storage_capacity >= 0),
    ADD CONSTRAINT check_positive_default_fee CHECK (default_fee IS NULL OR default_fee >= 0)
  `);

  // Indexes for search performance
  await knex.raw(`
    CREATE INDEX idx_warehouses_code ON warehouses (code);
    CREATE INDEX idx_warehouses_location_id ON warehouses (location_id);
    CREATE INDEX idx_warehouses_is_archived ON warehouses (is_archived);
    CREATE INDEX idx_warehouses_status_id ON warehouses (status_id);
    CREATE INDEX idx_warehouses_storage_capacity ON warehouses (storage_capacity);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_inventory_lots');
  await knex.schema.dropTableIfExists('warehouse_inventory');
  await knex.schema.dropTableIfExists('warehouses');
};
