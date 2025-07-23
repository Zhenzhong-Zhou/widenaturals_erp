/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering tax rate records (e.g., for admin UIs or dropdowns).
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering tax rates.
 *
 * Supports filtering by:
 * - Exact match fields: name, region, province, createdBy, updatedBy
 * - Boolean status: isActive
 * - Date range fields: validFrom, validTo, validOn, createdAfter, createdBefore
 * - Keyword search: ILIKE on name or province
 * - Optional restrictions on keyword to only valid or active records
 *
 * @param {Object} [filters={}] - Filters to apply to the tax rate query.
 * @param {string} [filters.name] - Exact match on tax rate name.
 * @param {string} [filters.region] - Match by region (e.g., 'Canada').
 * @param {string} [filters.province] - Match by province name or code.
 * @param {boolean} [filters.isActive] - Filter by active/inactive flag.
 * @param {string} [filters.createdBy] - Filter by creator user ID.
 * @param {string} [filters.updatedBy] - Filter by updater user ID.
 * @param {string} [filters.keyword] - Case-insensitive keyword match against name or province.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - (Internal) If true, restrict keyword results to currently valid tax rates based on date range.
 * @param {string} [filters._activeStatusId] - (Internal) Status ID to enforce for keyword-based filtering.
 * @param {string} [filters.validFrom] - Filter tax rates starting on or after this date (inclusive).
 * @param {string} [filters.validTo] - Filter tax rates ending on or before this date (inclusive).
 * @param {string} [filters.validOn] - Filter tax rates valid on this specific date.
 * @param {string} [filters.createdAfter] - Filter tax rates created on or after this date.
 * @param {string} [filters.createdBefore] - Filter tax rates created on or before this date.
 *
 * @returns {{ whereClause: string, params: any[] }} - An object containing the constructed SQL WHERE clause and its bound parameters.
 *
 * @throws {AppError} - If an error occurs during filter construction.
 */
const buildTaxRateFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.name) {
      conditions.push(`tr.name = $${paramIndex}`);
      params.push(filters.name);
      paramIndex++;
    }
    
    if (filters.region) {
      conditions.push(`tr.region = $${paramIndex}`);
      params.push(filters.region);
      paramIndex++;
    }
    
    if (filters.province) {
      conditions.push(`tr.province = $${paramIndex}`);
      params.push(filters.province);
      paramIndex++;
    }
    
    if (filters.isActive !== undefined) {
      conditions.push(`tr.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`tr.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`tr.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      const keywordConditions = [
        `(tr.name ILIKE $${paramIndex} OR tr.province ILIKE $${paramIndex})`
      ];
      params.push(keywordParam);
      paramIndex++;
      
      if (filters._restrictKeywordToValidOnly) {
        keywordConditions.push(`tr.valid_from <= NOW()`);
        keywordConditions.push(`(tr.valid_to IS NULL OR tr.valid_to >= NOW())`);
        keywordConditions.push(`tr.is_active = TRUE`);
      } else if (filters.isActive !== undefined) {
        // Only apply outside _restrictKeywordToValidOnly
        keywordConditions.push(`tr.is_active = $${paramIndex}`);
        params.push(filters.isActive);
        paramIndex++;
      }
      
      conditions.push(`(${keywordConditions.join(' AND ')})`);
    }
    
    if (filters.validFrom) {
      conditions.push(`tr.valid_from >= $${paramIndex}`);
      params.push(filters.validFrom);
      paramIndex++;
    }
    
    if (filters.validTo) {
      conditions.push(`tr.valid_to <= $${paramIndex}`);
      params.push(filters.validTo);
      paramIndex++;
    }
    
    if (filters.validOn) {
      conditions.push(`(
        tr.valid_from <= $${paramIndex} AND
        (tr.valid_to IS NULL OR tr.valid_to >= $${paramIndex})
      )`);
      params.push(filters.validOn);
      paramIndex++;
    }
    
    if (filters.createdAfter) {
      conditions.push(`tr.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`tr.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build tax rate filter', {
      context: 'tax-rate-repository/buildTaxRateFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare tax rate filter', {
      details: err.message,
      stage: 'build-tax-rate-where-clause',
    });
  }
};

module.exports = {
  buildTaxRateFilter,
};
