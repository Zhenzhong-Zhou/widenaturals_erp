/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table
      .uuid('id')
      .primary()
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('order_type_id')
      .notNullable()
      .references('id')
      .inTable('order_types');
    table
      .timestamp('order_date', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.jsonb('metadata').nullable();
    table.text('note').nullable();
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable();
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
  return knex.schema.dropTableIfExists('orders');
};
