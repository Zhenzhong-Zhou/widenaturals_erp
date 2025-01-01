/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('returns', (table) => {
    table.uuid('id').primary().references('id').inTable('orders');
    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table.uuid('order_type_id').notNullable().references('id').inTable('order_types');
    table.timestamp('return_date').defaultTo(knex.fn.now()).notNullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.text('reason').nullable();
    table.decimal('total_return_amount', 10, 2).nullable();
    table.jsonb('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('returns');
};
