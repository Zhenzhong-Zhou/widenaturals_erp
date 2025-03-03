/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('products', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('product_name', 255).notNullable();
    table.string('series', 100);
    table.string('brand', 100);
    table.string('category', 100);
    table.string('SKU', 100).unique().notNullable();
    table.string('barcode', 100).unique();
    table.string('market_region', 100);
    table.decimal('length_cm', 10, 2).notNullable();
    table.decimal('width_cm', 10, 2).notNullable();
    table.decimal('height_cm', 10, 2).notNullable();
    table.decimal('weight_g', 10, 2).notNullable();
    table.text('description');
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(['product_name', 'SKU'], 'idx_products_name_sku');
  });

  // Add generated columns and constraints using raw SQL
  await knex.raw(`
    ALTER TABLE products
    ADD COLUMN length_inch DECIMAL(10, 2) GENERATED ALWAYS AS (length_cm / 2.54) STORED,
    ADD COLUMN width_inch DECIMAL(10, 2) GENERATED ALWAYS AS (width_cm / 2.54) STORED,
    ADD COLUMN height_inch DECIMAL(10, 2) GENERATED ALWAYS AS (height_cm / 2.54) STORED,
    ADD COLUMN weight_lb DECIMAL(10, 2) GENERATED ALWAYS AS (weight_g / 453.592) STORED,
    ADD CONSTRAINT chk_positive_values
    CHECK (
      length_cm > 0 AND
      width_cm > 0 AND
      height_cm > 0 AND
      weight_g > 0
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE products
    DROP CONSTRAINT IF EXISTS chk_positive_values,
    DROP COLUMN IF EXISTS length_inch,
    DROP COLUMN IF EXISTS width_inch,
    DROP COLUMN IF EXISTS height_inch,
    DROP COLUMN IF EXISTS weight_lb;
  `);
  return knex.schema.dropTableIfExists('products');
};
