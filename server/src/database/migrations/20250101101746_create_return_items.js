/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('return_items', (table) => {
    table.uuid('id').primary();
    table.uuid('return_id').notNullable().references('id').inTable('returns');
    table
      .uuid('inventory_id')
      .notNullable()
      .references('id')
      .inTable('inventory');
    table.integer('quantity_returned').notNullable();
    table.text('reason');
    table.uuid('price_id').notNullable().references('id').inTable('pricing');
    table.decimal('price', 10, 2).notNullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.json('metadata');
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(
      ['return_id', 'inventory_id'],
      'idx_return_items_return_inventory'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('return_items');
};
