/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('bom_item_materials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Core relationships
    table
      .uuid('bom_item_id')
      .notNullable()
      .references('id')
      .inTable('bom_items');

    table
      .uuid('part_material_id')
      .notNullable()
      .references('id')
      .inTable('part_materials');

    // Optional direct link (shortcut)
    table
      .uuid('packaging_material_id')
      .references('id')
      .inTable('packaging_materials');

    // Quantities specific to this BOM usage
    table
      .decimal('material_qty_per_product', 10, 3)
      .notNullable()
      .checkPositive();
    table.string('unit', 20).notNullable();
    table.text('note');

    // Status & audit
    table.uuid('status_id').references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    // Metadata
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Uniqueness
    table.unique(['bom_item_id', 'part_material_id'], {
      indexName: 'uq_bom_item_part_material',
    });

    // Indexes
    table.index(['bom_item_id'], 'idx_bim_bom_item');
    table.index(['part_material_id'], 'idx_bim_part_material');
    table.index(['packaging_material_id'], 'idx_bim_packaging_material');
  });
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bom_item_materials');
};
