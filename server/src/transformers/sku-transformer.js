const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformSkuImage } = require('./sku-image-transformer');
const { transformSkuPricing } = require('./pricing-transformer');
const { transformComplianceRecord } = require('./compliance-record-transfomer');

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
 * Transform a single raw SKU row returned from the paginated SQL query
 * into a normalized, API-safe object. Produces nested groups for product
 * metadata, status metadata, and audit information. Automatically removes
 * null/undefined fields via `cleanObject`.
 *
 * ### Structure Returned:
 * {
 *   id,
 *   productId,
 *   sku,
 *   barcode,
 *   language,
 *   countryCode,
 *   marketRegion,
 *   sizeLabel,
 *   displayLabel,
 *   product: { id, name, series, brand, category, displayName },
 *   status: { id, name, date },
 *   createdBy: { id, firstname, lastname, displayName },
 *   updatedBy: { id, firstname, lastname, displayName }
 * }
 *
 * @param {Object} row - Raw DB row from getPaginatedSkus().
 * @returns {Object|null} Clean, transformed SKU record.
 */
const transformSkuListRecord = (row) => {
  if (!row) return null;
  
  // Safely build display label (avoids “  — 60” artifacts)
  const displayLabel = [
    row.brand,
    row.product_name,
    row.size_label ? `— ${row.size_label}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  
  return cleanObject({
    id: row.sku_id,
    productId: row.product_id,
    
    sku: row.sku,
    barcode: row.barcode,
    language: row.language,
    countryCode: row.country_code,
    marketRegion: row.market_region,
    sizeLabel: row.size_label,
    
    displayLabel,
    
    product: {
      id: row.product_id,
      name: row.product_name,
      series: row.series,
      brand: row.brand,
      category: row.category,
      displayName: getProductDisplayName(row),
    },
    
    status: {
      id: row.status_id,
      name: row.status_name,
      date: row.status_date,
    },
    
    createdBy: {
      id: row.created_by,
      firstname: row.created_by_firstname,
      lastname: row.created_by_lastname,
      displayName: getFullName(row.created_by_firstname, row.created_by_lastname),
    },
    
    updatedBy: {
      id: row.updated_by,
      firstname: row.updated_by_firstname,
      lastname: row.updated_by_lastname,
      displayName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
    },
  });
};

/**
 * Transform a paginated SKU query result by applying the SKU row
 * transformer to each record. Wraps the generic pagination formatter
 * (`transformPaginatedResult`) to return:
 *
 * {
 *   data: [ transformedRows... ],
 *   pagination: { page, limit, totalRecords, totalPages },
 *   sort: { sortBy, sortOrder }
 * }
 *
 * @param {Object} paginatedResult - Output from paginateResults().
 * @returns {Object} Normalized paginated response for API consumers.
 */
const transformPaginatedSkuListResults = (paginatedResult) => {
  return transformPaginatedResult(
    paginatedResult,
    transformSkuListRecord
  );
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

/**
 * @typedef {Object} SkuDetailSku
 * @description
 * Permission-safe SKU record returned from sliceSkuForUser().
 * Contains core SKU fields plus joined product metadata.
 *
 * @property {string} sku_id                  - Unique SKU identifier
 * @property {string} sku                     - SKU code
 * @property {string} barcode                 - Product barcode
 * @property {string} sku_description         - Descriptive text of the SKU
 * @property {string} language                - Language/locale code
 * @property {string} size_label              - Size or count label (e.g., "60 Capsules")
 * @property {string} country_code            - Country code (e.g., "CA", "US")
 * @property {string} market_region           - Market region (e.g., "CA", "INT")
 * @property {string} product_id              - Linked product ID
 * @property {string} product_name            - Product name
 * @property {string} product_series          - Product series
 * @property {string} product_brand           - Product brand
 * @property {string} product_category        - Product category
 * @property {number} length_cm               - Length in centimeters
 * @property {number} width_cm                - Width in centimeters
 * @property {number} height_cm               - Height in centimeters
 * @property {number} weight_g                - Weight in grams
 * @property {number} length_inch             - Length in inches
 * @property {number} width_inch              - Width in inches
 * @property {number} height_inch             - Height in inches
 * @property {number} weight_lb               - Weight in pounds
 * @property {string} sku_status_id           - Status UUID for the SKU
 * @property {string} sku_status_name         - Human-readable status name
 * @property {string|Date} sku_status_date    - When status was last changed
 * @property {string|Date} sku_created_at     - SKU creation timestamp
 * @property {string|Date} sku_updated_at     - SKU updated timestamp
 * @property {string} sku_created_by          - User ID who created SKU
 * @property {string} created_by_firstname    - Creator's first name
 * @property {string} created_by_lastname     - Creator's last name
 * @property {string} sku_updated_by          - User ID who last updated SKU
 * @property {string} updated_by_firstname    - Updater's first name
 * @property {string} updated_by_lastname     - Updater's last name
 */

/**
 * @typedef {Object} SkuDetailInput
 * @property {SkuDetailSku} sku
 * @property {Array<SkuDetailImage>} images
 * @property {Array<SkuDetailPricing>} pricing
 * @property {Array<SkuDetailCompliance>} complianceRecords
 */

/**
 * Transform raw SKU detail components into the final API-safe response object.
 *
 * This function consumes “sliced” (permission-filtered) records for:
 * - SKU core fields
 * - Product metadata
 * - Images
 * - Pricing
 * - Compliance documents
 *
 * And produces a **normalized, camelCase API payload** suitable for the client.
 *
 * ### Guarantees
 * - No duplicated or conflicting fields
 * - Only permission-safe data is included
 * - Missing categories (images/pricing/compliance) are returned as empty arrays
 * - Consistent object structure across all SKU detail responses
 *
 * @param {SkuDetailInput} input
 * @param {SkuDetailSku}          input.sku                 - Safe SKU record (already sliced)
 * @param {Array<SkuDetailImage>} input.images              - Safe image list (already sliced)
 * @param {Array<SkuDetailPricing>} input.pricing           - Safe pricing list (already sliced)
 * @param {Array<SkuDetailCompliance>} input.complianceRecords - Safe compliance list (already sliced)
 *
 * @returns {Object} Final API-ready SKU detail response
 */
const transformSkuDetail = ({ sku, images, pricing, complianceRecords }) => {
  if (!sku) return null;
  
  return {
    // --- SKU fields ---
    id: sku.sku_id,
    sku: sku.sku,
    barcode: sku.barcode,
    description: sku.sku_description,
    language: sku.language,
    sizeLabel: sku.size_label,
    countryCode: sku.country_code,
    marketRegion: sku.market_region,
    
    // --- Product ---
    product: {
      id: sku.product_id,
      name: sku.product_name,
      series: sku.product_series,
      brand: sku.product_brand,
      category: sku.product_category,
      displayName: getProductDisplayName(sku),
    },
    
    // --- Dimensions ---
    dimensions: {
      cm: {
        length: sku.length_cm,
        width: sku.width_cm,
        height: sku.height_cm,
      },
      inches: {
        length: sku.length_inch,
        width: sku.width_inch,
        height: sku.height_inch,
      },
      weight: {
        g: sku.weight_g,
        lb: sku.weight_lb,
      },
    },
    
    status: {
      id: sku.sku_status_id,
      name: sku.sku_status_name,
      date: sku.sku_status_date,
    },
    
    audit: {
      createdAt: sku.sku_created_at,
      createdBy: {
        id: sku.sku_created_by,
        fullName: getFullName(sku.created_by_firstname, sku.created_by_lastname),
      },
      updatedAt: sku.sku_updated_at,
      updatedBy: {
        id: sku.sku_updated_by,
        fullName: getFullName(sku.updated_by_firstname, sku.updated_by_lastname),
      },
    },
    
    // --- Lists with transformers applied ---
    images: images?.map(transformSkuImage) ?? [],
    pricing: pricing?.map(transformSkuPricing) ?? [],
    complianceRecords: complianceRecords?.map(transformComplianceRecord) ?? [],
  };
};

module.exports = {
  transformPaginatedSkuProductCardResult,
  transformSkuDetailsWithMeta,
  transformPaginatedSkuListResults,
  transformSkuRecord,
  transformSkuDetail,
};
