/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('manufacturers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.string('name', 150).notNullable().unique();
    table.string('code', 50).notNullable().unique();
    table.string('contact_name', 150);
    table.string('contact_email', 150);
    table.string('contact_phone', 50);

    table.uuid('location_id').references('id').inTable('locations');

    table.boolean('is_archived').defaultTo(false);

    table.text('description');

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Indexes
    table.index(['name'], 'idx_manufacturers_name');
    table.index(
      ['status_id', 'is_archived'],
      'idx_manufacturers_status_archived'
    );
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('manufacturers');
};
