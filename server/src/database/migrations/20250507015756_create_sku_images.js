/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sku_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('sku_id')
      .notNullable()
      .references('id')
      .inTable('skus');
    table.string('image_url').notNullable();
    table.string('image_type').defaultTo('main'); // e.g., 'main', 'thumbnail', 'lifestyle'
    table.integer('display_order').defaultTo(0);
    table.integer('file_size_kb');
    table.string('file_format');
    table.text('alt_text');
    table.boolean('is_primary').defaultTo(false); // only one per SKU should be true
    table
      .uuid('group_id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'));

    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.uuid('uploaded_by').references('id').inTable('users');

    table.index(['sku_id', 'group_id', 'display_order'], 'idx_sku_images_order');
    
    table.index(
      ['sku_id', 'is_primary', 'display_order'],
      'idx_sku_images_by_sku'
    );

    table.unique(['sku_id', 'image_url'], { indexName: 'uq_sku_image_unique' });
  });
  
  await knex.raw(`
    CREATE UNIQUE INDEX uq_primary_image_per_sku
    ON sku_images (sku_id)
    WHERE is_primary = TRUE;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Drop partial unique index BEFORE dropping the table
  await knex.raw(`DROP INDEX IF EXISTS uq_primary_image_per_sku`);
  
  // Drop table
  await knex.schema.dropTableIfExists('sku_images');
};
