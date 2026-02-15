/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clauses and parameter arrays
 * for filtering SKU code base records in dropdowns, SKU creation flows,
 * or admin search screens.
 *
 * Supports:
 * - Exact match filters (brand_code, category_code, status_id)
 * - Fuzzy keyword search (brand_code/category_code)
 * - Date filtering (created_at and status_date ranges)
 * - Fallback status enforcement for permission-based filtering
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a secure dynamic WHERE clause for filtering SKU code base records.
 *
 * @param {Object} [filters={}] - The optional filters.
 * @param {string} [filters.brand_code] - Exact match brand code.
 * @param {string} [filters.category_code] - Exact match category code.
 * @param {string} [filters.status_id] - Match by status id.
 * @param {string} [filters._activeStatusId] - Fallback enforced status.
 * @param {string} [filters.keyword] - Fuzzy keyword search.
 * @param {string} [filters.createdAfter] - created_at >= ISO timestamp.
 * @param {string} [filters.createdBefore] - created_at <= ISO timestamp.
 * @param {string} [filters.statusDateAfter] - status_date >= ISO timestamp.
 * @param {string} [filters.statusDateBefore] - status_date <= ISO timestamp.
 *
 * @returns {{ whereClause: string, params: any[] }}
 *
 * @throws {AppError} If filter construction fails.
 */
const buildSkuCodeBaseFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );
    filters = normalizeDateRangeFilters(
      filters,
      'statusDateAfter',
      'statusDateBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    // ------------------------------
    // Brand code
    // ------------------------------
    if (filters.brand_code) {
      conditions.push(`scb.brand_code = $${paramIndexRef.value}`);
      params.push(filters.brand_code);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Category code
    // ------------------------------
    if (filters.category_code) {
      conditions.push(`scb.category_code = $${paramIndexRef.value}`);
      params.push(filters.category_code);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Keyword search (brand_code / category_code)
    // ------------------------------
    if (filters.keyword) {
      conditions.push(`(
        scb.brand_code ILIKE $${paramIndexRef.value}
        OR scb.category_code ILIKE $${paramIndexRef.value}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Status filters (with fallback)
    // ------------------------------
    if (filters.status_id) {
      conditions.push(`scb.status_id = $${paramIndexRef.value}`);
      params.push(filters.status_id);
      paramIndexRef.value++;
    } else if (filters._activeStatusId) {
      conditions.push(`scb.status_id = $${paramIndexRef.value}`);
      params.push(filters._activeStatusId);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Created date range (UI date filter)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'scb.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    // ------------------------------
    // Status date range (UI date filter)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'scb.status_date',
      after: filters.statusDateAfter,
      before: filters.statusDateBefore,
      paramIndexRef,
    });

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build SKU code base filter', {
      context: 'sku-code-base-repository/buildSkuCodeBaseFilter',
      filters,
      error: err.message,
    });

    throw AppError.databaseError('Failed to prepare SKU code base filter', {
      details: err.message,
      stage: 'build-sku-code-base-where-clause',
    });
  }
};

module.exports = {
  buildSkuCodeBaseFilter,
};
