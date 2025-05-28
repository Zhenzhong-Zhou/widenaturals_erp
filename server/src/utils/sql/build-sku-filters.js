/**
 * @fileoverview build-sku-filter.js
 * Utility to dynamically construct SQL WHERE clauses and parameter arrays for filtering SKUs and products.
 * Used in repository layers to support paginated queries with optional filters.
 */

const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a dynamic SQL WHERE clause and parameter array for filtering active SKUs and products.
 *
 * @param {string} productStatusId - UUID of the 'active' status to filter both products and SKUs.
 * @param {Object} [filters={}] - Optional filters to apply.
 * @param {string} [filters.brand] - Product brand (e.g., "Canaherb").
 * @param {string} [filters.category] - Product category (e.g., "Herbal Natural").
 * @param {string} [filters.marketRegion] - SKU market region (e.g., "CN", "CA").
 * @param {string} [filters.sizeLabel] - SKU size label (e.g., "60 Capsules").
 * @param {string} [filters.keyword] - Partial product name for search (ILIKE).
 * @returns {{ whereClause: string, params: Array<any> }} SQL-safe WHERE clause and parameter list.
 */
const buildWhereClauseAndParams = (productStatusId, filters = {}) => {
  try {
    const fieldMap = SORTABLE_FIELDS.skuProductCards;
    const conditions = [`p.status_id = $1`, `sku.status_id = $1`];
    const params = [productStatusId];
    let paramIndex = 2;
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const field = fieldMap[key];
        if (!field) continue;
        
        if (key === 'keyword') {
          conditions.push(`${field} ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
        } else {
          conditions.push(`${field} = $${paramIndex}`);
          params.push(value);
        }
        
        paramIndex++;
      }
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to construct WHERE clause', {
      context: 'sku-repository/buildWhereClauseAndParams',
      error: err.message,
      filters,
      productStatusId,
    });
    throw AppError.transformerError('Failed to prepare filter conditions', {
      details: err.message,
      stage: 'build-where-clause',
    });
  }
};

module.exports = {
  buildWhereClauseAndParams,
};
