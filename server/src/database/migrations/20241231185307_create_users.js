/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique().index();
    table.uuid('role_id').references('id').inTable('roles').index();
    table.string('firstname', 100).nullable();
    table.string('lastname', 100).nullable();
    table.string('phone_number', 15).unique().nullable();
    table.string('job_title', 100).nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.text('note').nullable();
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_transfer_status');
  await knex.schema.dropTableIfExists('inventory_allocations');
  await knex.schema.dropTableIfExists('inventory_transfers');

  // Now it's safe to drop the `users` table
  await knex.schema.dropTableIfExists('users');
};
