/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tax_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable().unique(); // Ensure tax names are unique
    table.decimal('rate', 5, 2).notNullable().checkBetween([0, 100]); // Enforce valid percentage range (0-100)
    table.boolean('is_active').notNullable().defaultTo(true); // Ensure active tax rates are clearly marked
    table.timestamp('valid_from', { useTz: true }).notNullable();
    table.timestamp('valid_to', { useTz: true }).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Index for better query performance when filtering active tax rates
    table.index(['is_active', 'valid_from', 'valid_to']);
  });
  
  // Ensure that there cannot be overlapping tax rates for the same name
  await knex.raw(`
    ALTER TABLE tax_rates
    ADD CONSTRAINT unique_active_tax_rate_per_period
    UNIQUE (name, is_active, valid_from, valid_to);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tax_rates');
};
