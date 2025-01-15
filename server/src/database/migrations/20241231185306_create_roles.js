/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('roles', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary(); // Primary key with UUID
    table.string('name', 100).notNullable().unique().index(); // Name column with index
    table.string('role_group', 50).nullable(); // Optional role group
    table.text('description').nullable(); // Optional description
    table.uuid('parent_role_id').references('id').inTable('roles'); // Self-referencing foreign key
    table.integer('hierarchy_level').nullable().index(); // Indexed hierarchy level
    table.boolean('is_active').defaultTo(true); // Active status
    table.json('metadata').nullable(); // Optional metadata column
    table.uuid('status_id').notNullable().references('id').inTable('status'); // Foreign key to 'status'
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
