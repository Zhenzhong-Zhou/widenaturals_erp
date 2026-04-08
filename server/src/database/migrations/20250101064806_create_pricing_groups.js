/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('pricing_groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table
      .uuid('pricing_type_id')
      .notNullable()
      .references('id')
      .inTable('pricing_types');
    
    table.string('country_code', 10).notNullable(); // e.g. 'CA', 'US', 'GLOBAL'
    
    table.decimal('price', 10, 2).notNullable();
    table.timestamp('valid_from', { useTz: true }).notNullable();
    table.timestamp('valid_to',   { useTz: true }).nullable();
    
    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('status');
    
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at',  { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at',  { useTz: true }).defaultTo(knex.fn.now());
    
    table.uuid('created_by').nullable().references('id').inTable('users');
    table.uuid('updated_by').nullable().references('id').inTable('users');
    
    table.index(
      ['pricing_type_id', 'country_code', 'valid_from', 'valid_to'],
      'idx_pricing_groups_lookup'
    );
  });
  
  await knex.raw(`
    CREATE UNIQUE INDEX uq_pricing_groups_type_country_price_valid_from
    ON pricing_groups (
      pricing_type_id,
      country_code,
      price,
      valid_from
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pricing_groups');
};
