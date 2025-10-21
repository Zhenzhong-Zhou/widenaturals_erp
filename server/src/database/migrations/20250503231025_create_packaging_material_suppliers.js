/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('packaging_material_suppliers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('packaging_material_id')
      .notNullable()
      .references('id')
      .inTable('packaging_materials');
    table
      .uuid('supplier_id')
      .notNullable()
      .references('id')
      .inTable('suppliers');
    
    table.decimal('contract_unit_cost', 12, 4);
    table.string('currency', 5);
    table.date('valid_from');
    table.date('valid_to');
    
    table.boolean('is_preferred').notNullable().defaultTo(false);
    table.integer('lead_time_days').nullable(); // Optional supplier-specific lead time
    table.text('note').nullable(); // Any remarks about this relationship

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true });
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['packaging_material_id', 'supplier_id'], {
      indexName: 'uq_material_supplier_pair',
    });
    table.index(['supplier_id'], 'idx_material_suppliers_supplier');
    table.index(['packaging_material_id'], 'idx_material_suppliers_material');
  });
};

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('packaging_material_suppliers');
};
