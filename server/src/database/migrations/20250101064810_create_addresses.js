/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('addresses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('customer_id').nullable().references('id').inTable('customers');
    
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
    
    table.string('address_hash', 64).notNullable();
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.index(['customer_id']);
    table.index(['country', 'postal_code']);
    
    table.unique(['customer_id', 'address_hash'], { indexName: 'unique_customer_address_hash' });
  });
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS idx_addresses_customer_id_null
    ON addresses(customer_id)
    WHERE customer_id IS NULL
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('addresses');
};
