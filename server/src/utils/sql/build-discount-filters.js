/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering discount records (e.g., for dropdowns or admin tables).
 */

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
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (filters.name) {
      conditions.push(`d.name = $${paramIndex}`);
      params.push(filters.name);
      paramIndex++;
    }

    if (filters.discountType) {
      conditions.push(`d.discount_type = $${paramIndex}`);
      params.push(filters.discountType);
      paramIndex++;
    }

    if (filters.validFrom) {
      conditions.push(`d.valid_from >= $${paramIndex}`);
      params.push(filters.validFrom);
      paramIndex++;
    }

    if (filters.validTo) {
      conditions.push(`d.valid_to <= $${paramIndex}`);
      params.push(filters.validTo);
      paramIndex++;
    }

    if (filters.validOn) {
      conditions.push(`(
        d.valid_from <= $${paramIndex} AND
        (d.valid_to IS NULL OR d.valid_to >= $${paramIndex})
      )`);
      params.push(filters.validOn);
      paramIndex++;
    }

    if (filters.createdBy) {
      conditions.push(`d.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.updatedBy) {
      conditions.push(`d.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }

    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      conditions.push(
        `(d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`
      );
      params.push(keywordParam);
      paramIndex++;
    }

    // Apply visibility restrictions independently (even if not keyword-based in future)
    if (filters._restrictKeywordToValidOnly) {
      conditions.push(`d.valid_from <= NOW()`);
      conditions.push(`(d.valid_to IS NULL OR d.valid_to >= NOW())`);
    }

    if (filters.statusId) {
      conditions.push(`d.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    } else if (filters._activeStatusId) {
      // fallback if statusId was removed due to access restrictions
      conditions.push(`d.status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    }

    if (filters.createdAfter) {
      conditions.push(`d.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`d.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

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
