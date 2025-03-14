/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('compliances', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('product_id').notNullable().references('id').inTable('products');
    table.string('type', 100).notNullable();
    table.string('compliance_id', 100).notNullable();
    table.date('issued_date');
    table.date('expiry_date');
    table.text('description');
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes for faster queries
    table.index(['product_id', 'type'], 'idx_compliances_product_type'); // Ensure unique per product
    table.index(['compliance_id'], 'idx_compliances_compliance_id'); // Optimize compliance lookup
  });

  // Add unique constraint for (product_id, type)
  await knex.raw(`
    ALTER TABLE compliances
    ADD CONSTRAINT unique_compliance_product_type
    UNIQUE (product_id, type)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('compliances');
};
