/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('batch_registry', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()')); // unified ID
    
    table.enu('batch_type', ['product', 'packaging_material'], {
      useNative: true,
      enumName: 'batch_type_enum',
    }).notNullable();
    
    table.uuid('product_batch_id')
      .references('id')
      .inTable('product_batches');
    
    table.uuid('packaging_material_batch_id')
      .references('id')
      .inTable('packaging_material_batches');
    
    table.timestamp('registered_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('registered_by').references('id').inTable('users');
    table.text('note');
    
    table.unique(['product_batch_id']);
    table.unique(['packaging_material_batch_id']);
    table.check(
      `(product_batch_id IS NOT NULL AND packaging_material_batch_id IS NULL) OR
       (product_batch_id IS NULL AND packaging_material_batch_id IS NOT NULL)`
    ); // Enforce only one foreign key is set
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('batch_registry');
  await knex.raw(`DROP TYPE IF EXISTS batch_type_enum`);
};
