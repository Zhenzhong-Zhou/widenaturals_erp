const { getProductDisplayName } = require('../utils/display-name-utils');
/**
 * Transform raw SKU + product data into a structured SKU product card format.
 *
 * @param {Array<Object>} rows - Raw DB rows with joined SKU, product, price, and image data.
 * @returns {Array<Object>} Transformed array for product card grid.
 */
const transformSkuProductCardList = (rows) => {
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
}

module.exports = {
  transformSkuProductCardList,
};