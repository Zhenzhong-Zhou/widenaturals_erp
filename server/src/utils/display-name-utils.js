/**
 * @file display-name.js
 * @description Utility for generating standardized display names for products based on brand, region, or SKU prefix.
 *
 * Usage:
 *   const displayName = getProductDisplayName(row);
 */

/**
 * Display name rules mapped by brand name or SKU prefix.
 * Each rule is a function that takes (row, country_code) and returns a formatted name.
 * This allows different brands or prefixes to follow custom naming strategies.
 *
 * Rules:
 * - If brand is 'WIDE Naturals', append size label (e.g., "Omega-3 - 120 Softgels")
 * - If SKU brand starts with 'CH' or 'PG' and country_code is 'UN', return product name only
 * - If SKU brand starts with 'CH' or 'PG' and country_code is 'CN' or 'CA', append country_code
 * - Otherwise, fallback to raw product name
 */
const displayNameRules = {
  'WIDE Naturals': (row) => `${row.product_name} - ${row.size_label}`,
  
  CH: (row, countryCode) => (countryCode === 'UN' ? row.product_name : `${row.product_name} - ${countryCode}`),
  PG: (row, countryCode) => (countryCode === 'UN' ? row.product_name : `${row.product_name} - ${countryCode}`),
};

/**
 * Generate a display name for a product row based on brand, SKU prefix, and region.
 *
 * @param {Object} row - The product row object.
 * @param {string} row.product_name - The base product name.
 * @param {string} row.brand - Brand name (e.g. "Canaherb", "WIDE Naturals").
 * @param {string} row.sku - SKU code (e.g. "CH-HN101-R-CA").
 * @param {string} row.country_code -Country code (e.g. "CN", "CA", "UN").
 * @param {string} [row.display_name] - Optional custom display name from DB.
 * @returns {string} Final display name for rendering.
 */
const getProductDisplayName = (row) => {
  if (!row || typeof row !== 'object') return '';
  
  // Prefer preformatted display_name if it exists
  if (row.display_name) return row.display_name;
  
  const brand = row.brand;
  const skuPrefix = row.sku?.slice(0, 2).toUpperCase();
  const countryCode = (row.country_code || '').toUpperCase();
  const productName = row.product_name || row.item_name || row.itemName || '';
  
  // Prefer brand rule
  if (displayNameRules[brand]) {
    return displayNameRules[brand]({ ...row, product_name: productName }, countryCode);
  }
  
  // Then SKU prefix rule
  if (displayNameRules[skuPrefix]) {
    return displayNameRules[skuPrefix]({ ...row, product_name: productName }, countryCode);
  }
  
  // Fallback: size label format
  return row.size_label
    ? `${productName} - ${row.size_label}`
    : productName;
};

module.exports = {
  getProductDisplayName,
};
