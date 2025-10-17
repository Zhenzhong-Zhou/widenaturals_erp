const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

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
 * @typedef {Object} SkuBomCompositionRow
 * @property {string} product_id
 * @property {string} product_name
 * @property {string} brand
 * @property {string} series
 * @property {string} category
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string} barcode
 * @property {string} language
 * @property {string} country_code
 * @property {string} market_region
 * @property {string} size_label
 * @property {string|null} sku_description
 * @property {string} bom_id
 * @property {string} bom_code
 * @property {string} bom_name
 * @property {number} bom_revision
 * @property {boolean} is_active
 * @property {boolean} is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status_name
 * @property {string|null} bom_status_code
 * @property {Date|null} bom_status_date
 * @property {Date|null} bom_created_at
 * @property {string|null} bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {Date|null} bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 * @property {string|null} bom_item_id
 * @property {string|null} quantity_per_unit
 * @property {string|null} unit
 * @property {string|null} specifications
 * @property {string|null} estimated_unit_cost
 * @property {string|null} currency
 * @property {string|null} note
 * @property {Date|null} bom_item_created_at
 * @property {string|null} bom_item_created_by
 * @property {string|null} bom_item_created_by_firstname
 * @property {string|null} bom_item_created_by_lastname
 * @property {Date|null} bom_item_updated_at
 * @property {string|null} bom_item_updated_by
 * @property {string|null} bom_item_updated_by_firstname
 * @property {string|null} bom_item_updated_by_lastname
 * @property {string|null} part_id
 * @property {string|null} part_code
 * @property {string|null} part_name
 * @property {string|null} part_type
 * @property {string|null} unit_of_measure
 * @property {string|null} part_description
 */

/**
 * Transform flat rows from getSkuBomCompositionById() into a nested structure:
 *  SKU → BOM → BOM Items (each with Part info + audit metadata)
 *
 * @param {SkuBomCompositionRow[]} rows - Raw rows from the database query
 * @returns {{ header: object, details: object[] } | null}
 */
const transformSkuBomComposition = (rows = []) => {
  if (!rows || rows.length === 0) return null;
  
  try {
    const headerRow = rows[0]; // All header info repeated across rows
    const productName = getProductDisplayName(headerRow);
    
    // Header: shared info about Product, SKU, and BOM
    const header = {
      productId: headerRow.product_id,
      productName,
      brand: headerRow.brand,
      series: headerRow.series,
      category: headerRow.category,
      sku: {
        id: headerRow.sku_id,
        code: headerRow.sku_code,
        barcode: headerRow.barcode,
        language: headerRow.language,
        countryCode: headerRow.country_code,
        marketRegion: headerRow.market_region,
        sizeLabel: headerRow.size_label,
        description: headerRow.sku_description,
      },
      bom: {
        id: headerRow.bom_id,
        code: headerRow.bom_code,
        name: headerRow.bom_name,
        revision: Number(headerRow.bom_revision ?? 1),
        isActive: Boolean(headerRow.is_active),
        isDefault: Boolean(headerRow.is_default),
        description: headerRow.bom_description,
        status: {
          id: headerRow.bom_status_id,
          name: headerRow.bom_status_name,
          date: headerRow.bom_status_date,
        },
        audit: {
          createdAt: headerRow.bom_created_at,
          createdBy: {
            id: headerRow.bom_created_by,
            fullName: getFullName(headerRow.bom_created_by_firstname, headerRow.bom_created_by_lastname),
          },
          updatedAt: headerRow.bom_updated_at,
          updatedBy: {
            id: headerRow.bom_updated_by,
            fullName: getFullName(headerRow.bom_updated_by_firstname, headerRow.bom_updated_by_lastname),
          },
        },
      },
    };
    
    // Details: each BOM Item row + Part info + audit metadata
    const details = rows
      .filter((r) => r.bom_item_id)
      .map((r) => ({
        id: r.bom_item_id,
        quantityPerUnit: r.quantity_per_unit
          ? Number(r.quantity_per_unit)
          : null,
        unit: r.unit,
        specifications: r.specifications,
        estimatedUnitCost: r.estimated_unit_cost
          ? Number(r.estimated_unit_cost)
          : null,
        currency: r.currency,
        note: r.note,
        part: {
          id: r.part_id,
          code: r.part_code,
          name: r.part_name,
          type: r.part_type,
          unitOfMeasure: r.unit_of_measure,
          description: r.part_description,
        },
        audit: {
          createdAt: r.bom_item_created_at,
          createdBy: {
            id: r.bom_item_created_by,
            fullName: getFullName(r.bom_item_created_by_firstname, r.bom_item_created_by_lastname),
          },
          updatedAt: r.bom_item_updated_at,
          updatedBy: {
            id: r.bom_item_updated_by,
            fullName: getFullName(r.bom_item_updated_by_firstname, r.bom_item_updated_by_lastname),
          },
        },
      }));
    
    return { header, details };
  } catch (error) {
    // Log and rethrow transformer-level errors (not DB)
    logSystemException(error, 'Error transforming SKU BOM composition', {
      context: 'transformSkuBomComposition',
    });
    
    throw AppError.transformerError('Failed to transform SKU BOM composition', {
      context: 'transformSkuBomComposition',
    });
  }
};

module.exports = {
  transformPaginatedSkuProductCardResult,
  transformSkuDetailsWithMeta,
  transformSkuBomComposition,
};
