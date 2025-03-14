/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tax_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable(); // Allow duplicate names across provinces
    table.string('region', 50).notNullable().defaultTo('Canada'); // 🔹 New column for global support
    table.decimal('rate', 5, 2).notNullable().checkBetween([0, 100]); // Ensure percentage range (0-100)
    table.string('province', 50).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table
      .timestamp('valid_from', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.timestamp('valid_to', { useTz: true }).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // 🔹 Ensure uniqueness while allowing multiple tax rates for different periods
    table.unique(['name', 'province', 'region', 'valid_from']);

    // Index for better query performance
    table.index(['is_active', 'province', 'valid_from', 'valid_to']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tax_rates');
};
