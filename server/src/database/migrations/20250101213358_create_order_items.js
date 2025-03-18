/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity_ordered').notNullable();
    table.uuid('price_id').notNullable().references('id').inTable('pricing');
    table.decimal('price', 10, 2).nullable();
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('order_status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['order_id', 'product_id', 'price_id', 'price']);
  });
  
  await knex.raw(`
    ALTER TABLE order_items
    ADD CONSTRAINT check_price_non_negative CHECK (price IS NULL OR price >= 0);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_items');
};
