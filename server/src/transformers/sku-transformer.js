const { getProductDisplayName } = require('../utils/display-name-utils');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { getFullName } = require('../utils/name-utils');

/**
 * Transform raw SKU + product data into a structured SKU product card format.
 *
 * @param {Array<Object>} rows - Raw DB rows with joined SKU, product, price, and image data.
 * @returns {Array<Object>} Transformed array for product card grid.
 */
const transformSkuProductCardList = (rows) => {
  try {
    if (!Array.isArray(rows)) {
      throw AppError.validationError('Input must be an array of rows.');
    }
    
    return rows.map((row) => {
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
        
        status: unifiedStatus, // dynamically collapsed or nested
        
        npnComplianceId: row.compliance_id || null,
        msrpPrice: row.msrp_price ? Number(row.msrp_price) : null,
        
        imageUrl: row.primary_image_url || null,
        imageAltText: row.image_alt_text || '',
      };
    });
  } catch (error) {
    logError('Error transforming SKU product card list', null, {
      error: error.message,
      rowsSample: Array.isArray(rows) ? rows.slice(0, 1) : null,
    });
    return []; // Return an empty list to fail gracefully
  }
};

/**
 * Transforms raw SKU detail row into clean client-friendly structure.
 *
 * @param {object} row - Raw DB row from fetchSkuDetailsWithPricingAndMeta
 * @returns {object} Transformed SKU metadata for frontend display
 */
const transformSkuDetailsWithMeta = (row) => {
  const {
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
    product_id,
    product_name,
    series,
    brand,
    category,
    product_description,
    product_status_date,
    sku_status_name,
    product_status_name,
    prices = [],
    compliances = [],
    images = [],
    created_by,
    updated_by,
    created_at,
    updated_at,
    created_by_first_name,
    created_by_last_name,
    updated_by_first_name,
    updated_by_last_name,
  } = row;

  const status =
    sku_status_name === product_status_name
      ? sku_status_name
      : {
        sku: sku_status_name,
        product: product_status_name,
      };

  const description = sku_description?.trim() || product_description?.trim() || '';
  
  // Separate zoom and main
  const zoomImages = images.filter(img => img.type === 'zoom');
  const mainImages = images.filter(img => img.type === 'main');

  // Fallback: if no zoom available, duplicate main as zoom
  const effectiveZoomImages = zoomImages.length > 0
    ? zoomImages
    : mainImages.map(img => ({ ...img, type: 'zoom_fallback' }));

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
      createdAt: created_at ?? sku_created_at,
      createdBy: created_by
        ? {
          id: created_by,
          fullName: getFullName(created_by_first_name, created_by_last_name),
        }
        : null,
      updatedAt: updated_at ?? sku_updated_at,
      updatedBy: updated_by
        ? {
          id: updated_by,
          fullName: getFullName(updated_by_first_name, updated_by_last_name),
        }
        : null,
    },
    prices,
    compliances,
    images: filteredImages,
  };
};

module.exports = {
  transformSkuProductCardList,
  transformSkuDetailsWithMeta,
};