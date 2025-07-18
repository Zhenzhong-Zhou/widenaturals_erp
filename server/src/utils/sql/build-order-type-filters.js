/**
 * @fileoverview
 * Utility to dynamically build SQL WHERE clause and parameters
 * for filtering and paginating `order_types` table.
 *
 * Supports filtering by category, status, payment requirement,
 * user references, and fuzzy keyword search.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds an SQL WHERE clause and parameter array for filtering `order_types`.
 *
 * @param {Object} [filters={}] - Optional filter criteria.
 * @param {string} [filters.name] - Partial match on `name` (ILIKE).
 * @param {string} [filters.code] - Partial match on `code` (ILIKE).
 * @param {string} [filters.category] - Order category (e.g., 'sales', 'purchase').
 * @param {string} [filters.statusId] - Status ID (foreign key to `status` table).
 * @param {boolean} [filters.requiresPayment] - Whether the order type requires payment.
 * @param {string} [filters.createdBy] - ID of the user who created the record.
 * @param {string} [filters.updatedBy] - ID of the user who last updated the record.
 * @param {string} [filters.createdAfter] - Include records created on/after this ISO date.
 * @param {string} [filters.createdBefore] - Include records created on/before this ISO date.
 * @param {string} [filters.updatedAfter] - Include records updated on/after this ISO date.
 * @param {string} [filters.updatedBefore] - Include records updated on/before this ISO date.
 * @param {string} [filters.keyword] - Fuzzy search applied to `name`, `code`, and `description`.
 *
 * @returns {{ whereClause: string, params: any[] }} SQL WHERE clause strings and ordered parameter array.
 *
 * @example
 * const { whereClause, params } = buildOrderTypeFilter({
 *   category: 'sales',
 *   requiresPayment: true,
 *   keyword: 'return',
 * });
 * // Returns:
 * // whereClause: "1=1 AND ot.category = $1 AND ot.requires_payment = $2 AND (...)"
 * // params: ['sales', true, '%return%']
 *
 * @throws {AppError} If an error occurs while building the filter.
 */
const buildOrderTypeFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (filters.name) {
      conditions.push(`ot.name ILIKE $${paramIndex}`);
      params.push(`%${filters.name}%`);
      paramIndex++;
    }

    if (filters.code) {
      conditions.push(`ot.code ILIKE $${paramIndex}`);
      params.push(`%${filters.code}%`);
      paramIndex++;
    }

    if (filters.category) {
      conditions.push(`ot.category = $${paramIndex}`);
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.statusId) {
      conditions.push(`ot.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    }

    if (filters.requiresPayment !== undefined) {
      conditions.push(`ot.requires_payment = $${paramIndex}`);
      params.push(filters.requiresPayment);
      paramIndex++;
    }

    if (filters.createdBy) {
      conditions.push(`ot.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.updatedBy) {
      conditions.push(`ot.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }

    if (filters.createdAfter) {
      conditions.push(`ot.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`ot.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.updatedAfter) {
      conditions.push(`ot.updated_at >= $${paramIndex}`);
      params.push(filters.updatedAfter);
      paramIndex++;
    }

    if (filters.updatedBefore) {
      conditions.push(`ot.updated_at <= $${paramIndex}`);
      params.push(filters.updatedBefore);
      paramIndex++;
    }

    if (filters.keyword) {
      conditions.push(`(
        ot.name ILIKE $${paramIndex} OR
        ot.code ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndex++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build order type filter', {
      context: 'order-type-repository/buildOrderTypeFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare order type filter', {
      details: err.message,
      stage: 'build-order-type-where-clause',
    });
  }
};

module.exports = {
  buildOrderTypeFilter,
};
