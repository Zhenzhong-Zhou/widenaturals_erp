/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sku_code_bases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('brand_code', 10).notNullable();
    table.string('category_code', 10).notNullable();
    table.integer('base_code').notNullable().unique(); // e.g., 100, 200, 300

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['brand_code', 'category_code'], {
      indexName: 'idx_sku_base_pair_unique',
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sku_code_bases');
};
