/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_zones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('warehouse_inventory_id')
      .notNullable()
      .references('id')
      .inTable('warehouse_inventory');

    table.string('zone_code', 100).notNullable();
    table.integer('quantity').notNullable().defaultTo(0);
    table.integer('reserved_quantity').notNullable().defaultTo(0);

    table
      .timestamp('zone_entry_date', { useTz: true })
      .defaultTo(knex.fn.now());
    table.timestamp('zone_exit_date', { useTz: true }).nullable();

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['warehouse_inventory_id', 'zone_code']);
  });

  await knex.raw(`
    ALTER TABLE warehouse_zones
    ADD CONSTRAINT warehouse_zones_quantity_check
      CHECK (quantity >= 0),
    ADD CONSTRAINT warehouse_zones_reserved_quantity_check
      CHECK (reserved_quantity >= 0),
    ADD CONSTRAINT warehouse_zones_reserved_not_exceed_total_check
      CHECK (reserved_quantity <= quantity);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_zones');
};
