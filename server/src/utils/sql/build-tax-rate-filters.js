/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering tax rate records (e.g., for admin UIs or dropdowns).
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
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
    // -------------------------------------------------------------
    // Normalize date-only filters (UI intent)
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    // ------------------------------
    // Exact-match filters
    // ------------------------------
    if (filters.name) {
      conditions.push(`tr.name = $${paramIndexRef.value}`);
      params.push(filters.name);
      paramIndexRef.value++;
    }
    
    if (filters.region) {
      conditions.push(`tr.region = $${paramIndexRef.value}`);
      params.push(filters.region);
      paramIndexRef.value++;
    }
    
    if (filters.province) {
      conditions.push(`tr.province = $${paramIndexRef.value}`);
      params.push(filters.province);
      paramIndexRef.value++;
    }
    
    if (filters.isActive !== undefined) {
      conditions.push(`tr.is_active = $${paramIndexRef.value}`);
      params.push(filters.isActive);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Audit fields
    // ------------------------------
    if (filters.createdBy) {
      conditions.push(`tr.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`tr.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Keyword search (with restrictions)
    // ------------------------------
    if (filters.keyword) {
      const keywordConditions = [
        `(tr.name ILIKE $${paramIndexRef.value} OR tr.province ILIKE $${paramIndexRef.value})`,
      ];
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
      
      if (filters._restrictKeywordToValidOnly) {
        keywordConditions.push(`tr.valid_from <= NOW()`);
        keywordConditions.push(`(tr.valid_to IS NULL OR tr.valid_to >= NOW())`);
        keywordConditions.push(`tr.is_active = TRUE`);
      } else if (filters.isActive !== undefined) {
        keywordConditions.push(`tr.is_active = $${paramIndexRef.value}`);
        params.push(filters.isActive);
        paramIndexRef.value++;
      }
      
      conditions.push(`(${keywordConditions.join(' AND ')})`);
    }
    
    // ------------------------------
    // Validity windows (business timestamps — NOT normalized)
    // ------------------------------
    if (filters.validFrom) {
      conditions.push(`tr.valid_from >= $${paramIndexRef.value}`);
      params.push(filters.validFrom);
      paramIndexRef.value++;
    }
    
    if (filters.validTo) {
      conditions.push(`tr.valid_to <= $${paramIndexRef.value}`);
      params.push(filters.validTo);
      paramIndexRef.value++;
    }
    
    if (filters.validOn) {
      conditions.push(`(
        tr.valid_from <= $${paramIndexRef.value} AND
        (tr.valid_to IS NULL OR tr.valid_to >= $${paramIndexRef.value})
      )`);
      params.push(filters.validOn);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Created date range (UI date filter)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'tr.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
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
