const { getProductDisplayName } = require('../utils/display-name-utils');
/**
 * Transform raw SKU + product data into a structured SKU product card format.
 *
 * @param {Array<Object>} rows - Raw DB rows with joined SKU, product, price, and image data.
 * @returns {Array<Object>} Transformed array for product card grid.
 */
const transformSkuProductCardList = (rows) => {
  return rows.map((row) => ({
    skuId: row.sku_id,
    skuCode: row.sku,
    barcode: row.barcode,
    
    productId: row.id,
    displayName: getProductDisplayName(row),
    brand: row.brand,
    series: row.series,
    category: row.category,
    marketRegion: row.market_region,
    
    statusName: row.status_name,
    skuStatusName: row.sku_status_name,
    
    npnComplianceId: row.compliance_id || null,
    msrpPrice: row.msrp_price ? Number(row.msrp_price) : null,
    
    imageUrl: row.primary_image_url || null,
    imageAltText: row.image_alt_text || '',
  }));
}

module.exports = {
  transformSkuProductCardList,
};