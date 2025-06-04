/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('compliances', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Link to SKU
    table.uuid('sku_id').notNullable().references('id').inTable('skus');

    table.string('type', 100).notNullable(); // e.g., 'NPN', 'FDA', 'EUCert'
    table.string('compliance_id', 100).notNullable(); // e.g., '80012345'
    table.date('issued_date');
    table.date('expiry_date');
    table.text('description');

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(['sku_id', 'type'], 'idx_compliances_sku_type');
    table.index(['compliance_id'], 'idx_compliances_compliance_id');
  });

  // Add unique constraint per SKU per type
  await knex.raw(`
    ALTER TABLE compliances
    ADD CONSTRAINT unique_compliance_sku_type
    UNIQUE (sku_id, type)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliances');
};
