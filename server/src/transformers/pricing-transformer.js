const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult, includeFlagsBasedOnAccess } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');

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
 * Transforms a pricing row into a UI-friendly dropdown option.
 *
 * Constructs a human-readable `label` using SKU, pricing type name, and price,
 * with configurable display granularity. Includes computed flags like `isActive`
 * and `isValidToday` based on user access. Location name is only included if the user
 * has permission to view all statuses or validity windows.
 *
 * @param {Object} row - Raw pricing row from the database.
 * @param {string} row.id - Pricing ID.
 * @param {string|number} row.price - Pricing amount.
 * @param {string} row.sku - Associated SKU string.
 * @param {string} [row.product_name] - Product display name.
 * @param {string} [row.price_type] - Pricing type name (e.g., Retail, Wholesale).
 * @param {string} [row.location_name] - Location name (if applicable).
 * @param {boolean} [row.isActive] - Whether the pricing row is currently active.
 * @param {boolean} [row.isValidToday] - Whether the pricing row is valid today.
 *
 * @param {Object} userAccess - Flags representing user permission context.
 * @param {boolean} [userAccess.canViewAllStatuses] - If true, allows visibility of all pricing statuses.
 * @param {boolean} [userAccess.canViewAllValidLookups] - If true, allows visibility of expired/future-dated prices.
 *
 * @param {Object} [options={}] - Display behavior options.
 * @param {boolean} [options.showSku=true] - Whether to include product name and SKU in the label.
 * @param {boolean} [options.showPriceType=true] - Whether to include pricing type name in the label.
 * @param {boolean} [options.showPriceInLabel=true] - Whether to include the price in the label.
 * @param {boolean} [options.labelOnly=false] - If true, omit all flags like `isActive` and `isValidToday`.
 *
 * @returns {{
 *   id: string,
 *   label: string,
 *   price: string|number,
 *   pricingTypeName: string,
 *   locationName?: string,
 *   isActive?: boolean,
 *   isValidToday?: boolean
 * }} Transformed object for dropdown usage.
 */
const transformPricingLookupRow = (
  row,
  userAccess,
  {
    showSku = true,
    showPriceType = true,
    showPriceInLabel = true,
    labelOnly = false, // For minimal display (e.g., during sales order creation)
  } = {}
) => {
  const productDisplayName = getProductDisplayName(row);
  
  const labelParts = [];
  
  if (showSku) {
    labelParts.push(`${productDisplayName} (${row.sku})`);
  }
  
  if (showPriceType) {
    labelParts.push(row.price_type);
  }
  
  if (showPriceInLabel) {
    labelParts.push(`$${row.price}`);
  }
  
  const showLocation =
    userAccess?.canViewAllStatuses || userAccess?.canViewAllValidLookups;
  
  // Always include id and label
  const base = {
    id: row.id,
    label: labelParts.join(' · '),
  };
  
  // Optionally add more fields
  if (!labelOnly) {
    if (showLocation && row.location_name) {
      base.locationName = row.location_name;
    }
    
    base.price = row.price;
    base.pricingTypeName = row.price_type;
    
    const flagSubset = includeFlagsBasedOnAccess(row, userAccess);
    Object.assign(base, flagSubset);
  }
  
  return cleanObject(base);
};

/**
 * Transforms paginated pricing records into dropdown-compatible lookup format.
 *
 * Applies user access rules for conditional fields like `isActive`, `isValidToday`,
 * and `locationName`, and returns transformed pricing options.
 *
 * @param {Object} paginatedResult - Raw paginated DB result (e.g., from paginateQueryByOffset)
 * @param {Object} userAccess - Evaluated access control flags
 * @param {Object} [options] - Optional display config for label formatting
 * @param {boolean} [options.showSku=true] - Include SKU in label
 * @param {boolean} [options.showPriceType=true] - Include pricing type name in label
 * @param {boolean} [options.showPriceInLabel=true] - Include price in label
 * @param {boolean} [options.labelOnly=false] - Return only base display fields
 *
 * @returns {{ items: { id: string, label: string }[], hasMore: boolean }}
 */
const transformPricingPaginatedLookupResult = (
  paginatedResult,
  userAccess,
  options = {}
) =>
  transformPaginatedResult(
    paginatedResult,
    (row) => transformPricingLookupRow(row, userAccess, options),
    { includeLoadMore: true }
  );

module.exports = {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPaginatedPricingDetailResult,
  transformPricingPaginatedLookupResult,
};
