/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.uuid('session_id').nullable().references('id').inTable('sessions');

    table
      .enu('token_type', ['refresh', 'email_verification', 'password_reset'], {
        useNative: true,
        enumName: 'token_type_enum',
      })
      .notNullable();

    table.text('token_hash').notNullable(); // Store hash only (never raw token)

    table.timestamp('issued_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);

    table.text('context').nullable(); // E.g., device info, reset request ID, etc.

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').nullable();

    table.index(['user_id', 'token_type']);
    table.index(['token_hash']);
    table.index(['expires_at']);

    table.unique(['token_hash'], {
      indexName: 'tokens_token_hash_unique',
    });
  });

  await knex.raw(`
    CREATE UNIQUE INDEX tokens_session_id_token_type_active_unique
    ON tokens (session_id, token_type)
    WHERE is_revoked = false;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tokens');
  await knex.raw(`
    DROP TYPE IF EXISTS token_type_enum;
  `);
};
