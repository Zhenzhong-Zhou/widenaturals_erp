/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for filtering payment methods (e.g., dropdowns, paginated queries).
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering payment methods.
 *
 * Supports filtering by name, code, status, and creation metadata.
 * Also allows flexible keyword-based filtering with internal control over scope.
 *
 * @param {Object} [filters={}] - Optional filters for payment methods.
 * @param {string} [filters.name] - Optional exact match on name.
 * @param {string} [filters.code] - Optional exact match on code.
 * @param {boolean} [filters.isActive] - Optional active/inactive flag.
 * @param {string} [filters.createdBy] - Filter by creator user ID.
 * @param {string} [filters.updatedBy] - Filter by updater user ID.
 * @param {string} [filters.keyword] - Keyword search (ILIKE) against name, code, and description.
 * @param {string} [filters.createdAfter] - Filter by created_at >=.
 * @param {string} [filters.createdBefore] - Filter by created_at <=.
 * @param {boolean} [filters._restrictKeywordToNameOnly] - Internal use only:
 *   If true, restricts `keyword` search to `name ILIKE` only. This flag is set by the business layer
 *   based on permission checks and should not be passed by external clients.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL-compatible WHERE clause and bound parameters.
 *
 * @throws {AppError} - Throws if an error occurs during filter construction.
 */
const buildPaymentMethodFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (filters.name) {
      conditions.push(`pm.name = $${paramIndex}`);
      params.push(filters.name);
      paramIndex++;
    }

    if (filters.code) {
      conditions.push(`pm.code = $${paramIndex}`);
      params.push(filters.code);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`pm.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters.createdBy) {
      conditions.push(`pm.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.updatedBy) {
      conditions.push(`pm.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }

    if (filters.keyword) {
      if (filters._restrictKeywordToNameOnly) {
        conditions.push(`pm.name ILIKE $${paramIndex}`);
      } else {
        conditions.push(`(
          pm.name ILIKE $${paramIndex} OR
          pm.code ILIKE $${paramIndex} OR
          pm.description ILIKE $${paramIndex}
        )`);
      }
      params.push(`%${filters.keyword}%`);
      paramIndex++;
    }

    if (filters.createdAfter) {
      conditions.push(`pm.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`pm.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

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
