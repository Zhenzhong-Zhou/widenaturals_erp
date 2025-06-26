/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = function (knex) {
  return knex.schema.createTable('transfer_order_item_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.string('code', 32).notNullable().unique(); // e.g., 'PENDING', 'TRANSFERRED'
    table.string('name', 100).notNullable();         // Display name
    table.string('description', 255);                // Optional long description
    
    table.boolean('is_active').defaultTo(true).notNullable(); // Soft-disable logic
    
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('status_date').defaultTo(knex.fn.now()).notNullable();
    
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('transfer_order_item_status');
};
