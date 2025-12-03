/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  //
  // 1. compliance_records — master compliance documents
  //
  await knex.schema.createTable('compliance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('type', 100).notNullable(); // e.g., 'NPN', 'FDA', 'COA'
    table.string('compliance_id', 100).notNullable(); // e.g., '80012345'

    table.date('issued_date');
    table.date('expiry_date');
    table.text('description');

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('updated_at', { useTz: true });
    table.uuid('updated_by').references('id').inTable('users');

    // Recommended indexes
    table.index(['type', 'compliance_id'], 'idx_compliance_type_id');
  });

  // Optional but recommended: ensure no duplicates
  await knex.raw(`
    ALTER TABLE compliance_records
    ADD CONSTRAINT unique_compliance_type_id
    UNIQUE (type, compliance_id)
  `);

  //
  // 2. sku_compliance_links — join table for M:N relationship
  //
  await knex.schema.createTable('sku_compliance_links', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('sku_id')
      .notNullable()
      .references('id')
      .inTable('skus')
      .onDelete('CASCADE');
    table
      .uuid('compliance_record_id')
      .notNullable()
      .references('id')
      .inTable('compliance_records')
      .onDelete('CASCADE');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');

    // Ensure one SKU links to one compliance document only once
    table.unique(
      ['sku_id', 'compliance_record_id'],
      'unique_sku_compliance_link'
    );

    table.index(['sku_id'], 'idx_sku_compliance_sku');
    table.index(['compliance_record_id'], 'idx_sku_compliance_record');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sku_compliance_links');
  await knex.schema.dropTableIfExists('compliance_records');
};
