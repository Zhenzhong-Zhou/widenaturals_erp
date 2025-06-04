/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('packaging_materials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.string('name', 150).notNullable();
    table.string('code', 50).notNullable().unique(); // e.g. MAT-CAP001
    table.string('color', 50);
    table.string('size', 50);
    table.string('grade', 50); // e.g., 'food', 'medical'
    table.string('material_composition', 100); // e.g., 'plastic', 'paper', 'glass'
    table.string('unit', 20); // e.g., 'pc', 'g', 'ml'
    
    table.decimal('estimated_unit_cost', 12, 4);
    table.string('currency', 5); // 'USD', 'CAD', 'CNY'
    
    table.decimal('length_cm', 10, 2);
    table.decimal('width_cm', 10, 2);
    table.decimal('height_cm', 10, 2);
    table.decimal('weight_g', 10, 2);
    
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    
    table.boolean('is_archived').defaultTo(false);
    table.text('description');
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    // Indexes
    table.index(['name'], 'idx_packaging_materials_name');
    table.index(['code'], 'idx_packaging_materials_code');
  });
  
  // Add generated columns and value constraints
  await knex.raw(`
    ALTER TABLE packaging_materials
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
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('packaging_materials');
};
