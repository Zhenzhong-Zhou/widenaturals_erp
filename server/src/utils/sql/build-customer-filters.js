/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for filtering customers in dropdowns or paginated lists.
 *
 * Designed for secure, dynamic query construction for PostgreSQL using parameterized values.
 * Ensures flexibility across search screens, dropdowns, and admin filters.
 *
 * Supported filter types:
 * - Exact match (creator, status)
 * - Fuzzy search (keyword)
 * - Date filtering (created/status date ranges)
 * - Address presence logic (has/hasn't addresses)
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a dynamic SQL WHERE clause and parameter list for filtering customers.
 *
 * Filters are optional and can be combined to refine query results.
 * Output is parameterized and safe for use with pg query methods.
 *
 * @param {Object} [filters={}] - Optional filters to apply.
 * @param {string} [filters.region] - Region filter (placeholder, not currently used).
 * @param {string} [filters.country] - Country filter (placeholder, not currently used).
 * @param {string} [filters.createdBy] - Filter by the ID of the user who created the customer.
 * @param {string} [filters.keyword] - Keyword for fuzzy match against `firstname`, `lastname`, `email`, or `phone_number`.
 * @param {string} [filters.statusId] - Exact match filter for customer status.
 * @param {string} [filters._activeStatusId] - Fallback status if `statusId` is not provided (used for permission enforcement).
 * @param {string} [filters.createdAfter] - ISO string to filter by `created_at >=` (inclusive).
 * @param {string} [filters.createdBefore] - ISO string to filter by `created_at <=` (inclusive).
 * @param {string} [filters.statusDateAfter] - ISO string to filter by `status_date >=` (inclusive).
 * @param {string} [filters.statusDateBefore] - ISO string to filter by `status_date <=` (inclusive).
 * @param {boolean} [filters.onlyWithAddress] - If `true`, only include customers who have at least one address.
 *                                              If `false`, only include customers with no addresses.
 *                                              If `undefined`, do not apply address-based filtering.
 *
 * @returns {{ whereClause: string, params: any[] }} - An object with the SQL `whereClause` string and its associated `params`.
 *
 * @throws {AppError} - If query construction fails due to an unexpected error.
 *
 * @example
 * const { whereClause, params } = buildCustomerFilter({
 *   createdBy: 'user-uuid',
 *   keyword: 'john',
 *   createdAfter: '2024-01-01',
 *   onlyWithAddress: true,
 * });
 * // Returns:
 * // whereClause: "1=1 AND c.created_by = $1 AND (...) AND EXISTS (...)"
 * // params: ['user-uuid', 'john%', '%john%']
 */
const buildCustomerFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (filters.createdBy) {
      conditions.push(`c.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }

    if (filters.keyword) {
      const keywordParam1 = `${filters.keyword}%`;
      const keywordParam2 = `%${filters.keyword}%`;
      conditions.push(`(
        c.firstname ILIKE $${paramIndex} OR
        c.lastname ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex + 1} OR
        c.phone_number ILIKE $${paramIndex + 1}
      )`);
      params.push(keywordParam1, keywordParam2);
      paramIndex += 2;
    }

    if (filters.statusId) {
      conditions.push(`c.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    } else if (filters._activeStatusId) {
      // fallback status enforcement if user access is restricted
      conditions.push(`c.status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    }

    if (filters.createdAfter) {
      conditions.push(`c.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      conditions.push(`c.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.statusDateAfter) {
      conditions.push(`c.status_date >= $${paramIndex}`);
      params.push(filters.statusDateAfter);
      paramIndex++;
    }

    if (filters.statusDateBefore) {
      conditions.push(`c.status_date <= $${paramIndex}`);
      params.push(filters.statusDateBefore);
      paramIndex++;
    }

    if (filters.onlyWithAddress === true) {
      conditions.push(
        `EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`
      );
    } else if (filters.onlyWithAddress === false) {
      conditions.push(
        `NOT EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`
      );
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build customer filter', {
      context: 'customer-repository/buildCustomerFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare customer dropdown filter', {
      details: err.message,
      stage: 'build-customer-where-clause',
    });
  }
};

module.exports = {
  buildCustomerFilter,
};
