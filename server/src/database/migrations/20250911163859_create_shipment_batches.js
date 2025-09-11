/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('shipment_batches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('shipment_id').notNullable().references('id').inTable('outbound_shipments');
    table.uuid('batch_id').notNullable().references('id').inTable('batch_registry');
    table.integer('quantity_shipped').notNullable(); // from that batch
    table.text('notes').nullable();
    
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['shipment_id', 'batch_id']);
  });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('shipment_batches');
};
