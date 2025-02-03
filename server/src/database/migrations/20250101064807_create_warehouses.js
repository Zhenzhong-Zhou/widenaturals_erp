/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('warehouses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('warehouse_code', 50).notNullable().unique(); // New: Unique identifier
    table.string('name', 255).notNullable();
    table.uuid('location_id').notNullable().references('id').inTable('locations');
    table.integer('storage_capacity').nullable().checkPositive(); // New: Capacity tracking
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('warehouses');
};
