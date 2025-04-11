/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('discounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table
      .enum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT'], {
        useNative: true,
        enumName: 'discount_type_enum',
      })
      .notNullable();
    table.decimal('discount_value', 10, 2).notNullable();
    table.timestamp('valid_from', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('valid_to', { useTz: true }).nullable();
    table.text('description').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.index('status_id', 'idx_discounts_status'); // Index for status_id
    table.index('valid_to', 'idx_discounts_valid_to'); // Index for valid_to

    table.unique(['name', 'discount_type', 'valid_from']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('discounts');

  // ✅ Drop ENUM only if no table uses it
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON a.atttypid = t.oid
        WHERE t.typname = 'discount_type_enum'
      ) THEN
        DROP TYPE discount_type_enum;
      END IF;
    END $$;
  `);
};
