/**
 * @function
 * @description
 * Transforms a DB record from `sku_images` into a clean API response object.
 *
 * @param {Object} record - Row fetched from DB (snake_case keys).
 * @returns {Object} API-friendly object (camelCase, filtered fields).
 */
const transformSkuImageRow = (record) => ({
  id: record.id,
  skuId: record.sku_id ?? record.skuId,
  imageUrl: record.image_url ?? record.imageUrl,
  imageType: record.image_type ?? record.imageType,
  displayOrder: record.display_order ?? record.displayOrder,
  isPrimary: record.is_primary ?? record.isPrimary,
});

/**
 * @function
 * @description
 * Transforms an array of DB records from `sku_images` into an array of
 * API-friendly objects with camelCase keys and filtered fields.
 *
 * @param {Object[]} records - Array of DB rows (snake_case keys).
 * @returns {Object[]} Transformed API-friendly image objects.
 */
const transformSkuImageResults = (records = []) =>
  Array.isArray(records)
    ? records.map((record) => transformSkuImageRow(record))
    : [];

module.exports = {
  transformSkuImageResults,
};
