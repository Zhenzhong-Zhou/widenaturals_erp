const { getProductDisplayName } = require('../utils/display-name-utils');

/**
 * Transforms a raw SQL pricing row into a flattened pricing list item.
 *
 * @param {object} row - A single record from the pricing query result.
 * @returns {object} - Formatted pricing list item.
 */
const transformPricingListRecord = (row) => ({
  pricingId: row.pricing_id,
  price: row.price !== null ? Number(row.price) : null,
  validFrom: row.valid_from ?? null,
  validTo: row.valid_to ?? null,
  
  pricingType: {
    name: row.pricing_type,
    code: row.pricing_type_code,
  },
  
  sku: {
    id: row.sku_id,
    value: row.sku,
    countryCode: row.country_code,
    sizeLabel: row.size_label,
    barcode: row.barcode ?? null,
  },
  
  product: {
    id: row.product_id,
    name: getProductDisplayName(row),
    brand: row.brand,
  },
});

/**
 * Transforms an array of raw pricing rows.
 *
 * @param {Array<object>} rows - Raw SQL result rows.
 * @returns {Array<object>} - Transformed pricing list.
 */
const transformPricingList = (rows = []) => rows.map(transformPricingListRecord);

/**
 * Transforms a paginated pricing query result into API-ready structure.
 *
 * @param {object} paginatedResult - Raw result from pagination helper.
 * @param {Array<object>} paginatedResult.data
 * @param {object} paginatedResult.pagination
 * @returns {object} - Paginated API response.
 */
const transformPaginatedPricingResult = (paginatedResult) => ({
  data: transformPricingList(paginatedResult.data),
  pagination: {
    page: Number(paginatedResult.pagination?.page ?? 1),
    limit: Number(paginatedResult.pagination?.limit ?? 10),
    totalRecords: Number(paginatedResult.pagination?.totalRecords ?? 0),
    totalPages: Number(paginatedResult.pagination?.totalPages ?? 1),
  },
});

module.exports = {
  transformPaginatedPricingResult,
};
