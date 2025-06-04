/**
 * @fileoverview Utility to build SQL WHERE clause and parameter bindings for pricing record filters.
 */

/**
 * Builds dynamic SQL WHERE conditions and parameter bindings for pricing filters.
 *
 * @param {Object} filters - Optional filter fields.
 * @param {string} [filters.brand] - Filter by product brand.
 * @param {string} [filters.pricingType] - Filter by pricing type name.
 * @param {string} [filters.countryCode] - Filter by SKU country code.
 * @param {string} [filters.sizeLabel] - Filter by SKU size label.
 * @param {string} [filters.validFrom] - Filter by minimum validFrom date (inclusive).
 * @param {string} [filters.validTo] - Filter by maximum validTo date (inclusive).
 * @param {string} [keyword] - Optional search keyword to match product name or SKU (ILIKE).
 * @returns {{ whereClause: string, params: any[] }} An object containing the SQL WHERE clause string and parameter array.
 *
 * @example
 * const { whereClause, params } = buildPricingFilters({ brand: 'Canaherb' }, 'sleep');
 */
const buildPricingFilters = (filters = {}, keyword = '') => {
  const whereConditions = ['1=1'];
  const params = [];

  if (filters.brand) {
    params.push(filters.brand);
    whereConditions.push(`pr.brand = $${params.length}`);
  }

  if (filters.pricingType) {
    params.push(filters.pricingType);
    whereConditions.push(`pt.name = $${params.length}`);
  }

  if (filters.countryCode) {
    params.push(filters.countryCode);
    whereConditions.push(`s.country_code = $${params.length}`);
  }

  if (filters.sizeLabel) {
    params.push(filters.sizeLabel);
    whereConditions.push(`s.size_label = $${params.length}`);
  }

  if (filters.validFrom && filters.validTo) {
    params.push(filters.validFrom);
    whereConditions.push(`p.valid_from >= $${params.length}`);

    params.push(filters.validTo);
    whereConditions.push(`p.valid_to <= $${params.length}`);
  }

  if (keyword) {
    params.push(`%${keyword}%`);
    whereConditions.push(
      `(pr.name ILIKE $${params.length} OR s.sku ILIKE $${params.length})`
    );
  }

  return {
    whereClause: whereConditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPricingFilters,
};
