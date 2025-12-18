/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('user_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .index();
    
    table.text('image_url').notNullable();
    
    table
      .string('image_type', 50)
      .defaultTo('avatar'); // avatar | profile | thumbnail
    
    table.integer('display_order').defaultTo(0);
    
    table.integer('file_size_kb').nullable();
    table.string('file_format', 20).nullable();
    table.text('alt_text').nullable();
    
    table.boolean('is_primary').defaultTo(true);
    
    table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('uploaded_by').references('id').inTable('users');
    
    table.index(
      ['user_id', 'is_primary', 'display_order'],
      'idx_user_images_by_user'
    );
    
    table.unique(['user_id', 'image_url'], {
      indexName: 'uq_user_image_unique',
    });
  });
  
  // Enforce ONE primary image per user (Postgres partial index)
  await knex.raw(`
    CREATE UNIQUE INDEX uq_primary_image_per_user
    ON user_images (user_id)
    WHERE is_primary = TRUE;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP INDEX IF EXISTS uq_primary_image_per_user`);
  await knex.schema.dropTableIfExists('user_images');
};
