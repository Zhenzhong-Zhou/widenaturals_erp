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
      .inTable('skus')
      .onDelete('CASCADE');
    table.string('image_url').notNullable();
    table.string('image_type').defaultTo('main'); // e.g., 'main', 'thumbnail', 'lifestyle'
    table.integer('display_order').defaultTo(0);
    table.integer('file_size_kb');
    table.string('file_format');
    table.text('alt_text');
    table.boolean('is_primary').defaultTo(false); // only one per SKU should be true

    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.uuid('uploaded_by').references('id').inTable('users');

    table.index(['sku_id', 'display_order'], 'idx_sku_images_order');

    table.unique(['sku_id', 'image_url'], { indexName: 'uq_sku_image_unique' });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sku_images');
};
