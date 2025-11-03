/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').notNullable().references('id').inTable('orders');

    // Flexible item references
    table.uuid('sku_id').nullable().references('id').inTable('skus');
    table
      .uuid('packaging_material_id')
      .nullable()
      .references('id')
      .inTable('packaging_materials');

    table.integer('quantity_ordered').notNullable();

    table.uuid('price_id').nullable().references('id').inTable('pricing'); // optional
    table.decimal('price', 10, 2).nullable();
    table.decimal('subtotal', 10, 2).notNullable();

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('order_status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable();

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['order_id', 'sku_id'], {
      indexName: 'unique_order_sku_only',
    });
    table.unique(['order_id', 'packaging_material_id'], {
      indexName: 'unique_order_packaging_only',
    });
  });

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `);

  await knex.raw(`
    ALTER TABLE order_items
    ADD CONSTRAINT check_price_non_negative CHECK (price IS NULL OR price >= 0);
  `);

  await knex.raw(`
    ALTER TABLE order_items
    ADD CONSTRAINT check_subtotal_non_negative CHECK (subtotal >= 0);
  `);

  await knex.raw(`
    ALTER TABLE order_items
    ADD CONSTRAINT check_one_item_type_provided
    CHECK (
      (sku_id IS NOT NULL)::int +
      (packaging_material_id IS NOT NULL)::int = 1
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_items');
};
