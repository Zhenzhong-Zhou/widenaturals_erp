/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('boms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('sku_id').notNullable().references('id').inTable('skus');
    table.string('code', 50).notNullable().unique(); // e.g. "BOM-FOCUS-001"
    table.string('name', 100).notNullable(); // e.g. "Focus Capsules BOM"
    table.text('description');

    table.boolean('is_active').notNullable().defaultTo(false);
    table.boolean('is_default').notNullable().defaultTo(false);
    table.integer('revision').notNullable().defaultTo(1); // for versioning

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['sku_id', 'revision'], { indexName: 'uq_boms_sku_id_revision'});
    
    table.index(['sku_id'], 'idx_boms_sku_id');
    table.index(['is_active'], 'idx_boms_is_active');
    table.index(['sku_id', 'is_active'], 'idx_boms_sku_active');
    table.index(['status_id'], 'idx_boms_status_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('boms');
};
