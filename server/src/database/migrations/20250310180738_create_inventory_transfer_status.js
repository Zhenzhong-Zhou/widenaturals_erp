/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_transfer_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable(); // e.g., "Pending", "In Transit"
    table.string('code', 50).unique().notNullable(); // "TRANSFER_PENDING", "TRANSFER_IN_TRANSIT"
    table.text('description').nullable();
    table.boolean('is_final').defaultTo(false); // Marks completion states
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_transfer_status');
};
