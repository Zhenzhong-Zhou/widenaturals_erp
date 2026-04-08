/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('pricing', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table
      .uuid('pricing_group_id')
      .notNullable()
      .references('id')
      .inTable('pricing_groups');
    
    table
      .uuid('sku_id')
      .notNullable()
      .references('id')
      .inTable('skus');
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').nullable().references('id').inTable('users');
    
    table.index(['sku_id', 'pricing_group_id'], 'idx_pricing_sku_group');
  });
  
  await knex.raw(`
    ALTER TABLE pricing
    ADD CONSTRAINT unique_pricing_group_sku
    UNIQUE (pricing_group_id, sku_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pricing');
};
