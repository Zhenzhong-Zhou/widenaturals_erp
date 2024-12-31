/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
  return knex.schema.createTable('roles', table => {
    table.uuid('id').primary();
    table.string('name', 100).notNullable().unique().index();
    table.string('role_group', 50).nullable();
    table.text('description').nullable();
    table.uuid('parent_role_id').references('id').inTable('roles');
    table.integer('hierarchy_level').nullable().index();
    table.boolean('is_active').defaultTo(true);
    table.json('metadata').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('roles');
};
