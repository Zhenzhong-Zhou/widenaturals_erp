/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('part_materials', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('part_id').notNullable().references('id').inTable('parts');
    table.uuid('packaging_material_id').notNullable().references('id').inTable('packaging_materials');
    table.decimal('quantity', 10, 2).notNullable().checkPositive();
    table.string('unit', 20);
    table.text('note'); // Optional
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.unique(['part_id', 'packaging_material_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('part_materials');
};
