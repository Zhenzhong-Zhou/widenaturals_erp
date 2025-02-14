/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_action_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Name should be unique and have a minimum length
    table.string('name', 50).unique().notNullable().checkLength('>=', 3);

    table.text('description').nullable();

    // Status reference (ACTIVE, INACTIVE, etc.)
    table.uuid('status_id').notNullable().references('id').inTable('status');

    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // When status was last updated

    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Created/Updated By (FK to users table)
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Default actions that cannot be deleted (e.g., SYSTEM actions)
    table.boolean('default_action').notNullable().defaultTo(false);

    // Indexes for fast lookups
    table.index(['name'], 'idx_inventory_action_types_name');
    table.index(['status_id'], 'idx_inventory_action_types_status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('inventory_action_types');
};
