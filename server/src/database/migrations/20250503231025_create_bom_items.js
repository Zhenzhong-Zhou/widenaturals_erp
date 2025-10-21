/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('bom_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('bom_id').notNullable().references('id').inTable('boms');
    table.uuid('part_id').notNullable().references('id').inTable('parts');

    table.decimal('quantity_per_unit', 10, 3).notNullable(); // Required
    table.string('unit', 20).notNullable(); // 'pcs', 'g', etc.

    // Optional: Additional specs (QA or engineering details)
    table.text('specifications');
    table.text('note');

    // Optional override costing (otherwise fallback to materials.unit_cost)
    table.decimal('estimated_unit_cost', 12, 4);
    table.string('currency', 5); // 'USD', 'CAD', etc.

    // Timestamps & authorship
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(['bom_id'], 'idx_bom_items_bom_id');
    table.index(['part_id'], 'idx_bom_items_part_id');

    // Composite uniqueness to prevent duplicate part-material combos per BOM
    table.unique(['bom_id', 'part_id'], {
      indexName: 'uq_bom_part_material',
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bom_items');
};
