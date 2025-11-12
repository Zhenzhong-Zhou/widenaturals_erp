const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a single raw SKU and product row into a product card structure
 * suitable for frontend display (e.g., in product grids or SKU cards).
 *
 * @param {object} row - Raw row from the database combining SKU and product info.
 * @param {string} row.sku_id - UUID of the SKU.
 * @param {string} row.sku - SKU code.
 * @param {string} row.barcode - Product barcode.
 * @param {string} row.brand - Brand name.
 * @param {string} row.series - Product series.
 * @param {string} row.status_name - Product status name.
 * @param {string} row.sku_status_name - SKU-specific status name.
 * @param {string|null} row.compliance_id - Compliance ID (e.g., NPN).
 * @param {string|null} row.primary_image_url - Main product image URL.
 * @param {string|null} row.image_alt_text - Alt text for the product image.
 * @param {number|string|null} row.msrp_price - MSRP price.
 * @returns {object} Transformed product card object.
 */
const transformSkuProductCardRow = (row) => {
  const unifiedStatus =
    row.status_name === row.sku_status_name
      ? row.status_name
      : { product: row.status_name, sku: row.sku_status_name };

  return {
    skuId: row.sku_id,
    skuCode: row.sku,
    barcode: row.barcode,
    displayName: getProductDisplayName(row),
    brand: row.brand,
    series: row.series,
    status: unifiedStatus,
    npnComplianceId: row.compliance_id || null,
    msrpPrice: row.msrp_price ? Number(row.msrp_price) : null,
    imageUrl: row.primary_image_url || null,
    imageAltText: row.image_alt_text || '',
  };
};

/**
 * Transforms a paginated result of SKU product cards.
 *
 * @param {object} paginatedResult - Raw result from repository.
 * @returns {object} API-ready structure with pagination.
 */
const transformPaginatedSkuProductCardResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformSkuProductCardRow);

/**
 * Transforms raw SKU detail row into clean client-friendly structure.
 *
 * @param {object} row - Raw DB row from fetchSkuDetailsWithPricingAndMeta
 * @returns {object} Transformed SKU metadata for frontend display
 */
const transformSkuDetailsWithMeta = (row) => {
  const {
    // SKU-level
    sku_id,
    sku,
    barcode,
    language,
    country_code,
    market_region,
    size_label,
    sku_description,
    length_cm,
    width_cm,
    height_cm,
    weight_g,
    length_inch,
    width_inch,
    height_inch,
    weight_lb,
    sku_status_date,
    sku_created_at,
    sku_updated_at,
    sku_created_by,
    sku_updated_by,
    sku_created_by_firstname,
    sku_created_by_lastname,
    sku_updated_by_firstname,
    sku_updated_by_lastname,

    // Product-level
    product_id,
    product_name,
    series,
    brand,
    category,
    product_description,
    product_status_date,
    product_created_at,
    product_updated_at,
    product_created_by,
    product_updated_by,
    product_created_by_firstname,
    product_created_by_lastname,
    product_updated_by_firstname,
    product_updated_by_lastname,

    // Shared/meta
    sku_status_name,
    product_status_name,
    prices = [],
    compliances = [],
    images = [],
  } = row;

  const getAuditUser = (id, firstName, lastName) => {
    const fullName = getFullName(firstName, lastName);
    return id || fullName ? { id: id ?? null, fullName } : null;
  };

  const status =
    sku_status_name === product_status_name
      ? sku_status_name
      : { sku: sku_status_name, product: product_status_name };

  const description =
    sku_description?.trim() || product_description?.trim() || '';

  // Separate zoom and main
  const zoomImages = images.filter((img) => img.type === 'zoom');
  const mainImages = images.filter((img) => img.type === 'main');

  // Fallback: if no zoom available, duplicate main as zoom
  const effectiveZoomImages =
    zoomImages.length > 0
      ? zoomImages
      : mainImages.map((img) => ({ ...img, type: 'zoom_fallback' }));

  // Merge for a final result (optional: remove duplicates)
  const filteredImages = [...mainImages, ...effectiveZoomImages];

  return {
    skuId: sku_id,
    sku,
    barcode,
    language,
    countryCode: country_code,
    marketRegion: market_region,
    sizeLabel: size_label,
    description,
    dimensions: {
      lengthCm: Number(length_cm),
      widthCm: Number(width_cm),
      heightCm: Number(height_cm),
      weightG: Number(weight_g),
      lengthInch: Number(length_inch),
      widthInch: Number(width_inch),
      heightInch: Number(height_inch),
      weightLb: Number(weight_lb),
    },
    status,
    statusDate: sku_status_date ?? product_status_date,
    product: {
      id: product_id,
      product_name,
      displayName: getProductDisplayName(row),
      brand,
      series,
      category,
    },
    audit: {
      createdAt: sku_created_at ?? product_created_at,
      createdBy:
        getAuditUser(
          sku_created_by,
          sku_created_by_firstname,
          sku_created_by_lastname
        ) ??
        getAuditUser(
          product_created_by,
          product_created_by_firstname,
          product_created_by_lastname
        ),
      updatedAt: sku_updated_at ?? product_updated_at,
      updatedBy:
        getAuditUser(
          sku_updated_by,
          sku_updated_by_firstname,
          sku_updated_by_lastname
        ) ??
        getAuditUser(
          product_updated_by,
          product_updated_by_firstname,
          product_updated_by_lastname
        ),
    },
    prices,
    compliances,
    images: filteredImages,
  };
};

/**
 * Transforms an array of SKU rows returned from an insert or query
 * into a minimal API response format.
 *
 * @param {object[]} skuRows - Array of rows returned from insertSkusBulk or query.
 * @param {string[]} generatedSkus - Array of corresponding generated SKU codes.
 * @returns {object[]} - Transformed list of minimal SKU objects.
 */
const transformSkuRecord = (skuRows, generatedSkus = []) => {
  if (!Array.isArray(skuRows) || skuRows.length === 0) return [];
  
  return skuRows.map((row, idx) => ({
    id: row.id,
    skuCode: generatedSkus[idx] ?? null,
  }));
};

module.exports = {
  transformPaginatedSkuProductCardResult,
  transformSkuDetailsWithMeta,
  transformSkuRecord,
};
