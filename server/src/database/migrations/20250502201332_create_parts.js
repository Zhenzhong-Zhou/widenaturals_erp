/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('parts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique(); // SKU-like internal code
    table.string('type', 50).notNullable(); // e.g. capsule, lid, label, box
    table.string('unit_of_measure'); // e.g. "piece", "roll", "bag"
    table.text('description'); // Optional details
    
    table.boolean('is_active').notNullable().defaultTo(true);
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['type']);
    table.index(['code']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('parts');
};
