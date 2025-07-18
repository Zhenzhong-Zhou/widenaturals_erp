/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('payment_methods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('name', 100).notNullable().unique(); // e.g., "Credit Card", "Bank Transfer"
    table.string('code', 50).notNullable().unique(); // e.g., "credit_card", "bank_transfer"

    table.text('description').nullable();

    table.integer('display_order').defaultTo(0); // optional for sorting UI dropdowns

    table.boolean('is_active').defaultTo(true);

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('payment_methods');
};
