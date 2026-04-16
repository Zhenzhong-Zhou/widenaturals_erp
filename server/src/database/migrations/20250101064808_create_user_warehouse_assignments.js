/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('user_warehouse_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('user_id').notNullable().references('id').inTable('users');
    table
      .uuid('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses');

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['user_id', 'warehouse_id']);
  });

  await knex.raw(`
    CREATE INDEX idx_user_warehouse_assignments_user
      ON user_warehouse_assignments (user_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_warehouse_assignments');
};
