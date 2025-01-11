/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    // Primary key with UUID
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();

    // Foreign key to roles table
    table
      .uuid('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .index();

    // Foreign key to permissions table
    table
      .uuid('permission_id')
      .notNullable()
      .references('id')
      .inTable('permissions')
      .index();

    // Foreign key to status table
    table.uuid('status_id').notNullable().references('id').inTable('status');

    // Timestamps
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys for audit fields
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Composite unique constraint for role and permission
    table.unique(['role_id', 'permission_id'], {
      indexName: 'unique_role_permission',
    });

    // Index for efficient queries
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
