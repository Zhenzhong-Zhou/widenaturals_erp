/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('addresses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.string('full_name', 150).nullable(); // for recipient name
    table.string('phone', 20).nullable();
    table.string('email', 150).nullable();
    
    table.string('label', 50).nullable();
    
    table.string('address_line1', 255).notNullable();
    table.string('address_line2', 255).nullable();
    table.string('city', 100).notNullable();
    table.string('state', 100).nullable();
    table.string('postal_code', 20).notNullable();
    
    table.string('country', 100).notNullable().defaultTo('Canada'); // ISO or country name
    table.string('region', 100).nullable(); // Flexible for Canada, China, EU, etc.
    
    table.text('note').nullable(); // optional delivery notes or tags
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now()).notNullable();
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['country', 'postal_code']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('addresses');
};
