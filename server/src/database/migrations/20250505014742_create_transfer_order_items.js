/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('transfer_order_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table
      .uuid('transfer_order_id')
      .notNullable()
      .references('id')
      .inTable('orders');
    
    // Support for either a product, packaging material or batch_id (polymorphic)
    table.uuid('product_id').nullable().references('id').inTable('products');
    table
      .uuid('packaging_material_id')
      .nullable()
      .references('id')
      .inTable('packaging_materials');
    table.uuid('batch_id').nullable().references('id').inTable('batch_registry');
    
    // Enforce that exactly one of product or packaging material is set
    table.integer('quantity').notNullable().checkPositive();
    
    table.string('unit').nullable(); // e.g., 'bottle', 'box', 'kg'
    
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('transfer_order_item_status');
    
    // Metadata
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['transfer_order_id'], 'idx_transfer_order_id');
    table.index(['product_id'], 'idx_transfer_product_id');
    table.index(['packaging_material_id'], 'idx_transfer_pm_id');
    table.index(['batch_id'], 'idx_transfer_batch_id');
  });
  await knex.raw(`
    ALTER TABLE transfer_order_items
    ADD COLUMN material_reference_id UUID
    GENERATED ALWAYS AS (COALESCE(batch_id, product_id, packaging_material_id)) STORED
  `);
    await knex.raw(`
    ALTER TABLE transfer_order_items
    ADD CONSTRAINT uniq_transfer_item_per_material
    UNIQUE (transfer_order_id, material_reference_id)
  `);
  
  await knex.raw(`
    ALTER TABLE transfer_order_items
    ADD CONSTRAINT chk_one_material_reference
    CHECK (
      (batch_id IS NOT NULL)::int +
      (product_id IS NOT NULL)::int +
      (packaging_material_id IS NOT NULL)::int = 1
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transfer_order_items');
};
