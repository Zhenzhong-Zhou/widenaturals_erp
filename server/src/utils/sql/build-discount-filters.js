/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering discount records (e.g., for dropdowns or admin tables).
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering discounts.
 *
 * Supports filtering by:
 * - Exact match fields: name, discount type, status ID, createdBy, updatedBy
 * - Date fields: createdAfter, createdBefore, validFrom, validTo, validOn
 * - Keyword search on name and description (ILIKE)
 * - Optional restriction: keyword search limited to currently valid and active discounts
 *
 * @param {Object} [filters={}] - Filters to apply.
 * @param {string} [filters.name] - Exact match on discount name.
 * @param {string} [filters.discountType] - Filter by discount type (e.g., 'PERCENTAGE', 'FIXED_AMOUNT').
 * @param {string} [filters.statusId] - Filter by discount status UUID.
 * @param {string} [filters.createdBy] - Filter by the user ID who created the discount.
 * @param {string} [filters.updatedBy] - Filter by the user ID who last updated the discount.
 * @param {string} [filters.keyword] - Case-insensitive keyword search on discount name or description.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - If true, keyword results are limited to currently valid (date-based) discounts.
 * @param {string} [filters._activeStatusId] - Optional internal field to enforce active status ID for keyword filtering.
 * @param {string} [filters.validFrom] - Include discounts valid on or after this date (inclusive).
 * @param {string} [filters.validTo] - Include discounts valid on or before this date (inclusive).
 * @param {string} [filters.validOn] - Include discounts valid on this specific date.
 * @param {string} [filters.createdAfter] - Include discounts created on or after this date.
 * @param {string} [filters.createdBefore] - Include discounts created on or before this date.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL-safe WHERE clause and bound parameter array.
 *
 * @throws {AppError} - Throws a database error if filter construction fails.
 */
const buildDiscountFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date range filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    if (filters.name) {
      conditions.push(`d.name = $${paramIndexRef.value}`);
      params.push(filters.name);
      paramIndexRef.value++;
    }

    if (filters.discountType) {
      conditions.push(`d.discount_type = $${paramIndexRef.value}`);
      params.push(filters.discountType);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Validity window filters
    // ------------------------------
    if (filters.validFrom) {
      conditions.push(`d.valid_from >= $${paramIndexRef.value}`);
      params.push(filters.validFrom);
      paramIndexRef.value++;
    }

    if (filters.validTo) {
      conditions.push(`d.valid_to <= $${paramIndexRef.value}`);
      params.push(filters.validTo);
      paramIndexRef.value++;
    }

    if (filters.validOn) {
      conditions.push(`(
        d.valid_from <= $${paramIndexRef.value} AND
        (d.valid_to IS NULL OR d.valid_to >= $${paramIndexRef.value})
      )`);
      params.push(filters.validOn);
      paramIndexRef.value++;
    }

    if (filters.createdBy) {
      conditions.push(`d.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`d.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      conditions.push(
        `(d.name ILIKE $${paramIndexRef.value} OR d.description ILIKE $${paramIndexRef.value})`
      );
      params.push(keywordParam);
      paramIndexRef.value++;
    }

    // Apply visibility restrictions independently
    if (filters._restrictKeywordToValidOnly) {
      conditions.push(`d.valid_from <= NOW()`);
      conditions.push(`(d.valid_to IS NULL OR d.valid_to >= NOW())`);
    }

    // Status filter with fallback
    if (filters.statusId) {
      conditions.push(`d.status_id = $${paramIndexRef.value}`);
      params.push(filters.statusId);
      paramIndexRef.value++;
    } else if (filters._activeStatusId) {
      conditions.push(`d.status_id = $${paramIndexRef.value}`);
      params.push(filters._activeStatusId);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Created date filters (via helper)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'd.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build discount filter', {
      context: 'discount-repository/buildDiscountFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare discount filter', {
      details: err.message,
      stage: 'build-discount-where-clause',
    });
  }
};

module.exports = {
  buildDiscountFilter,
};
