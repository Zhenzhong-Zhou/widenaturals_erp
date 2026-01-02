const { getProductDisplayName } = require('../utils/display-name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformSkuImage } = require('./sku-image-transformer');
const { transformSkuPricing } = require('./pricing-transformer');
const { transformComplianceRecord } = require('./compliance-record-transfomer');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * @typedef {object} RawSkuProductCardRow
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string} barcode
 * @property {string} product_name
 * @property {string} brand
 * @property {string} series
 * @property {string} category
 * @property {string|null} product_status_name  - Product status
 * @property {string|null} sku_status_name      - SKU-specific status
 * @property {string|null} compliance_type
 * @property {string|null} compliance_id
 * @property {number|string|null} msrp_price
 * @property {string|null} primary_image_url
 * @property {string|null} image_alt_text
 * @property {string|null} market_region
 */

/**
 * @typedef {object} SkuProductCard
 * @property {string} skuId
 * @property {string} skuCode
 * @property {string} barcode
 * @property {string} displayName
 * @property {string} brand
 * @property {string} series
 * @property {string} category
 * @property {string|{product: string|null, sku: string|null}} status
 * @property {{ type: string|null, number: string|null } | null} compliance
 * @property {{ msrp: number|null }} price
 * @property {{ url: string|null, alt: string }} image
 */

/**
 * Normalize a single SKU + Product row into a product-card response.
 *
 * This structure feeds API results for product grids, SKU list pages, etc.
 *
 * @param {RawSkuProductCardRow} row
 * @returns {SkuProductCard}
 */
const transformSkuProductCardRow = (row) => {
  if (!row) return null;

  // ---------------------------------------------------------
  // Unified status logic
  // ---------------------------------------------------------
  let status;

  const productStatus = row.product_status_name || null;
  const skuStatus = row.sku_status_name || null;

  if (!productStatus && !skuStatus) {
    status = null;
  } else if (productStatus === skuStatus) {
    status = productStatus; // both active
  } else {
    status = {
      product: productStatus,
      sku: skuStatus,
    };
  }

  // ---------------------------------------------------------
  // Compliance record (NPN, FDA, etc.)
  // ---------------------------------------------------------
  const compliance =
    row.compliance_type || row.compliance_id
      ? {
          type: row.compliance_type || null,
          number: row.compliance_id || null,
        }
      : null;

  // ---------------------------------------------------------
  // Safe pricing object
  // ---------------------------------------------------------
  const price = {
    msrp: row.msrp_price ? Number(row.msrp_price) : null,
  };

  // ---------------------------------------------------------
  // Image object
  // ---------------------------------------------------------
  const image = {
    url: row.primary_image_url || null,
    alt: row.image_alt_text || '',
  };

  // ---------------------------------------------------------
  // Product display name
  // ---------------------------------------------------------
  const displayName =
    typeof getProductDisplayName === 'function'
      ? getProductDisplayName(row)
      : `${row.product_name ?? ''} ${row.market_region ?? ''}`.trim();

  // ---------------------------------------------------------
  // Final normalized card structure
  // ---------------------------------------------------------
  return {
    skuId: row.sku_id,
    skuCode: row.sku_code,
    barcode: row.barcode,

    displayName,

    brand: row.brand,
    series: row.series,
    category: row.category,

    status,
    compliance,
    price,
    image,
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
 * Transform a single raw SKU row returned from the paginated SQL query
 * into a normalized, API-safe object. Produces nested groups for product
 * metadata, status metadata, audit information, and now includes a
 * `primaryImageUrl` returned by the LATERAL JOIN on `sku_images`.
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
 *   primaryImageUrl,   // NEW FIELD
 *
 *   product: {
 *     id,
 *     name,
 *     series,
 *     brand,
 *     category,
 *     displayName
 *   },
 *
 *   status: {
 *     id,
 *     name,
 *     date
 *   },
 *
 *   audit: {
 *     createdBy: { id, firstname, lastname, displayName },
 *     updatedBy: { id, firstname, lastname, displayName },
 *     createdAt,
 *     updatedAt
 *   }
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

    primaryImageUrl: row.primary_image_url || null,

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

    audit: compactAudit(makeAudit(row)),
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
  return transformPaginatedResult(paginatedResult, transformSkuListRecord);
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

    audit: compactAudit(makeAudit(sku)),

    // --- Lists with transformers applied ---
    images: images?.map(transformSkuImage) ?? [],
    pricing: pricing?.map(transformSkuPricing) ?? [],
    complianceRecords: complianceRecords?.map(transformComplianceRecord) ?? [],
  };
};

module.exports = {
  transformPaginatedSkuProductCardResult,
  transformPaginatedSkuListResults,
  transformSkuRecord,
  transformSkuDetail,
};
