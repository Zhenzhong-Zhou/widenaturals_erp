/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary(); // Primary key with UUID
    table
      .string('name', 100)
      .notNullable();
    table
      .string('key', 100)
      .notNullable()
      .unique()
      .comment('Technical key for programmatic use');
    table
      .string('description', 255)
      .nullable()
      .comment('Description of the permission');
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('status')
      .comment('Status of the permission');
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the record was created');
    table
      .timestamp('updated_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the record was last updated');
    table
      .uuid('created_by')
      .references('id')
      .inTable('users')
      .comment('User who created this record');
    table
      .uuid('updated_by')
      .references('id')
      .inTable('users')
      .comment('User who last updated this record');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('permissions');
};
