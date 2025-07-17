/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_types', (table) => {
    table
      .uuid('id')
      .primary()
      .primary()
      .defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable();
    table
      .string('category', 50)
      .notNullable()
      .checkIn([
        'purchase',
        'sales',
        'transfer',
        'return',
        'manufacturing',
        'logistics',
        'adjustment',
      ]);
    table.string('code', 20).unique().notNullable();
    table.boolean('requires_payment').defaultTo(false);
    table.text('description').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['category', 'status_id'], 'order_types_category_status_id_index');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_types');
};
