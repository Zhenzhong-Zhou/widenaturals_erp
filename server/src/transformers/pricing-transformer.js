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
 * @returns {Array<Object>} - Flattened and human-readable rows
 */
const transformExportPricingData = (rows = []) => {
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

/**
 * @typedef {Object} SlicedSkuPricing
 * @description
 * Permission-filtered pricing row from slicePricingForUser().
 * All visibility rules are already applied before transformation.
 *
 * @property {string} id                      - Pricing record ID
 * @property {string} skuId                   - SKU ID this pricing belongs to
 * @property {Object} priceType
 * @property {string} priceType.name          - Human-readable price type (e.g., MSRP, Retail)
 * @property {Object} location
 * @property {string} location.name           - Location name (e.g., "Vancouver Office")
 * @property {string} location.type           - Location type (e.g., "Office")
 * @property {number} price                   - Price amount
 * @property {string|Date} validFrom          - When price becomes valid
 * @property {string|Date} validTo            - When price expires
 * @property {Object} [status]                - Optional status metadata
 * @property {string} status.id               - Status UUID
 * @property {string|Date} status.date        - Status change date
 * @property {Object} [audit]                   - Optional audit metadata
 * @property {string|Date} audit.createdAt      - Created timestamp
 * @property {Object|null} audit.createdBy      - Creator identity
 * @property {string} audit.createdBy.id        - Creator user ID
 * @property {string} audit.createdBy.firstname - Creator first name
 * @property {string} audit.createdBy.lastname  - Creator last name
 * @property {string|Date} audit.updatedAt      - Updated timestamp
 * @property {Object|null} audit.updatedBy      - Updater identity
 * @property {string} audit.updatedBy.id        - Updater user ID
 * @property {string} audit.updatedBy.firstname - Updater first name
 * @property {string} audit.updatedBy.lastname  - Updater last name
 */

/**
 * @typedef {Object} SkuDetailPricing
 * @description
 * Final API-facing DTO for pricing inside SKU detail responses.
 *
 * @property {string} id                        - Pricing record ID
 * @property {string} skuId                     - SKU ID
 * @property {string} priceType
 * @property {{name: string, type: string}} location
 * @property {number} price
 * @property {string|Date|null} validFrom
 * @property {string|Date|null} validTo
 */

/**
 * Transform a single *sliced* pricing row into an API-safe DTO.
 *
 * This function performs a pure mapping from a permission-filtered
 * pricing record (SlicedSkuPricing) into the normalized output shape
 * (SkuDetailPricing).
 *
 * Permission logic (allowed pricing types, status visibility,
 * historical pricing, etc.) MUST be handled upstream in
 * slicePricingForUser().
 *
 * @param {SlicedSkuPricing|null} row
 *        A single pricing row already processed by slicePricingForUser().
 *
 * @returns {SkuDetailPricing|null}
 *        Normalized pricing DTO for the SKU detail response.
 */
const transformSkuPricing = (row) => {
  if (!row) return null;

  // -----------------------------
  // Status (optional)
  // -----------------------------
  const status = row.status
    ? {
        id: row.status.id,
        date: row.status.date,
      }
    : undefined;

  // -----------------------------
  // Final Returned DTO
  // -----------------------------
  return {
    id: row.id,
    skuId: row.skuId,
    priceType: row.priceType?.name ?? null,

    location: {
      name: row.location?.name ?? null,
      type: row.location?.type ?? null,
    },

    price: row.price,
    validFrom: row.validFrom,
    validTo: row.validTo,

    status,
    audit: row.audit,
  };
};

module.exports = {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPaginatedPricingDetailResult,
  transformSkuPricing,
};
