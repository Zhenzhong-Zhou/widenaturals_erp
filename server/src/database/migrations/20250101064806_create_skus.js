/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('skus', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('product_id').notNullable().references('id').inTable('products');
    
    table.string('sku', 100).notNullable();
    table.string('barcode', 100).nullable();
    
    table.string('language', 10); // e.g., 'en', 'fr', 'en-zh'
    table.string('country_code', 2); // ISO 3166-1 alpha-2
    table.string('market_region', 100); // e.g., 'Canada', 'International', 'Universe'
    
    table.string('size_label', 100);
    
    table.text('description');
    
    table.decimal('length_cm', 10, 2).notNullable();
    table.decimal('width_cm', 10, 2).notNullable();
    table.decimal('height_cm', 10, 2).notNullable();
    table.decimal('weight_g', 10, 2).notNullable();
    
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['product_id', 'sku'], 'idx_skus_product_sku');
    table.index(['product_id', 'size_label', 'country_code'], 'idx_skus_lookup_key');
    
    table.unique(['product_id', 'sku']);
  });
  
  // Add check constraint
  await knex.raw(`
    ALTER TABLE skus
    ADD CONSTRAINT chk_country_code_format CHECK (country_code ~ '^[A-Z]{2}$');
  `);
  
  // Add generated columns and value constraints
  await knex.raw(`
    ALTER TABLE skus
    ADD COLUMN length_inch DECIMAL(10, 2) GENERATED ALWAYS AS (length_cm / 2.54) STORED,
    ADD COLUMN width_inch DECIMAL(10, 2) GENERATED ALWAYS AS (width_cm / 2.54) STORED,
    ADD COLUMN height_inch DECIMAL(10, 2) GENERATED ALWAYS AS (height_cm / 2.54) STORED,
    ADD COLUMN weight_lb DECIMAL(10, 2) GENERATED ALWAYS AS (weight_g / 453.592) STORED,
    ADD CONSTRAINT chk_positive_dimensions
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
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('skus');
};
