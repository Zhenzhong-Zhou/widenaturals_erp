const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

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
    id: row.pricing_type_id,
    name: row.pricing_type,
    code: row.pricing_type_code,
    slug: row.pricing_type_slug,
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
 * Transforms a paginated pricing query result using the shared pagination utility.
 *
 * @param {Object} paginatedResult - Raw-paginated result from the pricing repository.
 * @param {Array<Object>} paginatedResult.data - Raw pricing rows.
 * @param {Object} paginatedResult.pagination - Pagination metadata.
 * @returns {Object} Transformed response containing structured pricing data and pagination info.
 */
const transformPaginatedPricingResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformPricingListRecord);

/**
 * Transforms raw pricing data rows into flat export-friendly format.
 *
 * @param {Array<Object>} rows - Raw DB query result
 * @param {string} format - Optional export format ('csv' | 'xlsx' | 'txt')
 * @returns {Array<Object>} - Flattened and human-readable rows
 */
const transformExportPricingData = (rows = [], format = 'csv') => {
  return rows.map((row) => ({
    SKU: row.sku,
    Brand: row.brand,
    'Product Name': getProductDisplayName(row),
    Barcode: row.barcode,
    'Size Label': row.size_label,
    'Country Code': row.country_code,
    'Pricing Type': row.pricing_type,
    Price: row.price,
    'Valid From': row.valid_from,
    'Valid To': row.valid_to,
  }));
};

/**
 * /**
 *  * Transforms a single raw pricing detail row into a structured object.
 *  *
 *  * @param {Object} row - Raw database row.
 *  * @returns {Object} Transformed pricing detail.
 *  */
const transformPricingDetailRow = (row) => {
  return {
    pricingType: {
      name: row.pricing_type,
    },
    pricing: {
      locationId: row.location_id,
      locationName: row.location_name,
      price: row.price,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      status: {
        id: row.pricing_status_id,
        name: row.pricing_status_name,
      },
      createdAt: row.pricing_created_at,
      createdBy: {
        fullname: getFullName(
          row.created_by_firstname,
          row.created_by_lastname
        ),
      },
      updatedAt: row.pricing_updated_at,
      updatedBy: {
        fullname: getFullName(
          row.updated_by_firstname,
          row.updated_by_lastname
        ),
      },
    },
    sku: {
      sku: row.sku,
      barcode: row.barcode,
      countryCode: row.country_code,
      sizeLabel: row.size_label,
    },
    product: {
      productName: getProductDisplayName(row),
      brand: row.brand_name,
    },
    productCount:
      row.product_count !== undefined ? Number(row.product_count) : undefined,
  };
};

/**
 * Transforms a paginated pricing detail result using the shared pagination transformer.
 *
 * @param {Object} result - Raw-paginated result from the pricing detail query.
 * @param {Array<Object>} result.data - Array of raw pricing detail rows.
 * @param {Object} result.pagination - Pagination metadata including page, limit, totalRecords, totalPages.
 * @returns {Object} Transformed result containing formatted pricing detail rows and pagination info.
 */
const transformPaginatedPricingDetailResult = (result) =>
  transformPaginatedResult(result, transformPricingDetailRow);

module.exports = {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPaginatedPricingDetailResult,
};
