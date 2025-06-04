/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('pricing_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable();
    table.string('code', 50).notNullable().unique();
    table.string('slug', 50).unique();
    table.text('description').nullable();

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.index(['name'], 'idx_pricing_types_name');
    table.index(['code'], 'idx_pricing_types_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pricing_types');
};
