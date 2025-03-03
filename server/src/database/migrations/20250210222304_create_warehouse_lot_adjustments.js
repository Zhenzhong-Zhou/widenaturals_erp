/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouse_lot_adjustments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Foreign Keys
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
    table.string('lot_number', 100).notNullable();
    table
      .uuid('adjustment_type_id')
      .notNullable()
      .references('id')
      .inTable('lot_adjustment_types');

    table.integer('previous_quantity').notNullable();
    table.integer('adjusted_quantity').notNullable();
    table.integer('new_quantity').notNullable();

    table.uuid('status_id').references('id').inTable('warehouse_lot_status');

    table
      .timestamp('adjustment_date', { useTz: true })
      .defaultTo(knex.fn.now());

    table.uuid('adjusted_by').notNullable().references('id').inTable('users');
    table.text('comments').nullable();

    // Constraints
    table.check('new_quantity >= 0'); // Ensures stock never goes negative
    table.check('adjusted_quantity <> 0'); // Prevents zero adjustments

    // Unique constraint to prevent duplicate adjustments at the same timestamp
    table.unique([
      'warehouse_id',
      'inventory_id',
      'lot_number',
      'adjustment_date',
    ]);

    // Timestamps
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Created/Updated By
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Index for better performance
    table.index(
      ['warehouse_id', 'inventory_id', 'lot_number'],
      'idx_wh_lot_inv_lotnum'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouse_lot_adjustments');
};
