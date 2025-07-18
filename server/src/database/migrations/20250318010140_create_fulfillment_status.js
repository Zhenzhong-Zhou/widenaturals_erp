/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('fulfillment_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('name', 100).notNullable(); // e.g., 'Pending', 'Shipped'
    table.string('code', 32).notNullable().unique(); // e.g., 'PENDING', 'SHIPPED'
    table.integer('sort_order').notNullable().defaultTo(0);
    table.string('category', 32).nullable(); // e.g., 'internal', 'external'
    table.boolean('is_default').notNullable().defaultTo(false);
    table.string('description', 255).nullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Optional track who defined the status
    table.uuid('created_by').references('id').inTable('users').nullable();
    table.uuid('updated_by').references('id').inTable('users').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('fulfillment_status');
};
