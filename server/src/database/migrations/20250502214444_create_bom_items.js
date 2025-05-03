/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('bom_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('bom_id').notNullable().references('id').inTable('boms');
    table.uuid('part_id').notNullable().references('id').inTable('parts');
    
    table.decimal('quantity_per_unit', 10, 3).notNullable(); // Required: per finished product
    table.string('unit', 20).notNullable(); // e.g., 'pcs', 'g', 'ml'
    
    // Optional variant reference fields
    table.string('size', 50);
    table.string('color', 50);
    table.string('material', 100);
    table.string('material_grade', 100);
    
    // Optional dimensional fields
    table.decimal('length_cm', 10, 2);
    table.decimal('width_cm', 10, 2);
    table.decimal('height_cm', 10, 2);
    table.decimal('weight_g', 10, 2);
    
    // Optional costing
    table.decimal('estimated_unit_cost', 12, 4);
    table.string('currency', 5); // 'USD', 'CAD', 'CNY'
    
    // Additional metadata
    table.text('specifications');    // e.g., "FDA-approved"
    table.text('note');              // engineering or QA context
    
    // Timestamps & authorship
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Indexes
    table.index(['bom_id']);
    table.index(['part_id']);
    
    // Composite uniqueness
    table.unique(['bom_id', 'part_id', 'length_cm', 'width_cm', 'height_cm', 'color', 'material'], {
      indexName: 'uq_bom_item_variant',
    });
  });
  
  // Add generated columns and value constraints
  await knex.raw(`
    ALTER TABLE bom_items
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
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bom_items');
};
