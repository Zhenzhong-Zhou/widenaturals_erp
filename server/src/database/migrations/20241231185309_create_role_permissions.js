/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary();
    table
      .uuid('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .index();
    table
      .uuid('permission_id')
      .notNullable()
      .references('id')
      .inTable('permissions')
      .index();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.index(
      ['role_id', 'permission_id'],
      'role_permission_composite_index'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('role_permissions');
};
