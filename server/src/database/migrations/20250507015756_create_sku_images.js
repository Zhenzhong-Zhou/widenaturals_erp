/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sku_images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('sku_id').notNullable().references('id').inTable('skus');
    // Storage location (mutable)
    table.string('image_url', 1024).notNullable();
    table.string('image_type', 50).defaultTo('main'); // e.g., 'main', 'thumbnail', 'lifestyle'
    table.integer('display_order').notNullable().defaultTo(0);
    table.integer('file_size_kb');
    table.string('file_format', 20);
    table.text('alt_text');
    table.boolean('is_primary').notNullable().defaultTo(false); // only one per SKU should be true
    table.uuid('group_id').notNullable();

    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.uuid('uploaded_by').references('id').inTable('users');

    // Ordering index
    table.index(
      ['sku_id', 'group_id', 'display_order'],
      'idx_sku_images_order'
    );

    // Querying primary & sorting
    table.index(
      ['sku_id', 'is_primary', 'display_order'],
      'idx_sku_images_by_sku'
    );

    // Prevent duplicate image types inside same group
    table.unique(['sku_id', 'group_id', 'image_type'], {
      indexName: 'uq_sku_group_image_type',
    });
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
