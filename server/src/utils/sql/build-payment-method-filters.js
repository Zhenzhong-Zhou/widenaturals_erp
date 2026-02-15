/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering payment methods (used in dropdowns, paginated tables, and search).
 *
 * Supports filtering by name, code, status, creation metadata, and keyword-based fuzzy search.
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically constructs an SQL WHERE clause and parameter list for filtering payment methods.
 *
 * Supported filters include:
 * - Exact matching on `name` or `code`
 * - Keyword-based fuzzy search (`ILIKE`) against name, code, and description
 * - Active/inactive status
 * - Filtering by creator or updater
 * - Date range filtering on `created_at`
 *
 * Internal flags allow the business layer to enforce additional constraints:
 * - `_restrictKeywordToNameOnly`: restricts keyword search to name only
 * - `_restrictToActiveOnly`: enforces `is_active = true` regardless of filters
 *
 * @param {Object} [filters={}] - Optional filter criteria.
 * @param {string} [filters.name] - Exact match on name.
 * @param {string} [filters.code] - Exact match on code.
 * @param {boolean} [filters.isActive] - Filter by active/inactive status.
 * @param {string} [filters.createdBy] - Filter by creator user ID.
 * @param {string} [filters.updatedBy] - Filter by updater user ID.
 * @param {string} [filters.keyword] - Fuzzy search keyword (ILIKE) on name/code/description.
 * @param {string} [filters.createdAfter] - Filter by created_at >= (ISO timestamp).
 * @param {string} [filters.createdBefore] - Filter by created_at <= (ISO timestamp).
 * @param {boolean} [filters._restrictKeywordToNameOnly] - Internal use only: restricts keyword match to name.
 * @param {boolean} [filters._restrictToActiveOnly] - Internal use only: forces `is_active = true` regardless of `filters.isActive`.
 *
 * @returns {{ whereClause: string, params: any[] }} SQL WHERE clause and parameter array.
 *
 * @throws {AppError} If an error occurs while constructing the WHERE clause or parameter list.
 */
const buildPaymentMethodFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    // ------------------------------
    // Exact match filters
    // ------------------------------
    if (filters.name) {
      conditions.push(`pm.name = $${paramIndexRef.value}`);
      params.push(filters.name);
      paramIndexRef.value++;
    }

    if (filters.code) {
      conditions.push(`pm.code = $${paramIndexRef.value}`);
      params.push(filters.code);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Audit fields
    // ------------------------------
    if (filters.createdBy) {
      conditions.push(`pm.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`pm.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Keyword search
    // ------------------------------
    if (filters.keyword) {
      const keywordClause = filters._restrictKeywordToNameOnly
        ? `pm.name ILIKE $${paramIndexRef.value}`
        : `(pm.name ILIKE $${paramIndexRef.value}
            OR pm.code ILIKE $${paramIndexRef.value}
            OR pm.description ILIKE $${paramIndexRef.value})`;

      conditions.push(keywordClause);
      params.push(`%${filters.keyword.trim().replace(/\s+/g, ' ')}%`);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Active / visibility enforcement
    // ------------------------------
    if (filters._restrictToActiveOnly === true) {
      conditions.push(`pm.is_active = true`);
    } else if (filters.isActive !== undefined) {
      conditions.push(`pm.is_active = $${paramIndexRef.value}`);
      params.push(filters.isActive);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Created date filters
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'pm.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build payment method filter', {
      context: 'payment-method-repository/buildPaymentMethodFilter',
      error: err.message,
      filters,
    });

    throw AppError.databaseError('Failed to prepare payment method filter', {
      details: err.message,
      stage: 'build-payment-method-where-clause',
    });
  }
};

module.exports = {
  buildPaymentMethodFilter,
};
