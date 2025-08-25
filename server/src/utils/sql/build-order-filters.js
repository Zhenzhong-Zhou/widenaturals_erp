/**
 * @fileoverview
 * Utility to dynamically build an SQL `WHERE` clause and parameters array
 * for filtering and paginating records from the `orders` table.
 *
 * This builder is designed to be used with paginated order queries and supports:
 * - Filtering by order number, order type, order status
 * - Audit fields (created_by, updated_by)
 * - Date ranges (created_at, status_date)
 * - Keyword search (with optional restriction to order number)
 * - Internal overrides (e.g., `_activeStatusId`, `_restrictKeywordToOrderNumberOnly`)
 *
 * Output can be used with `pg` parameterized queries, ensuring SQL safety and flexibility.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a SQL `WHERE` clause and parameter array for filtering the `orders` table.
 *
 * This function converts a flexible filter object into a SQL-safe `WHERE` clause with
 * numbered placeholders and matching parameter values. Designed to work with the
 * `o.` alias for the `orders` table.
 *
 * Supported filters:
 * - `orderNumber` — partial match on `order_number` using `ILIKE`.
 * - `orderTypeId` — exact match (string) or `IN` clause (array).
 * - `orderStatusId` — exact match unless `_activeStatusId` is specified.
 * - `_activeStatusId` — internal override to force status filtering.
 * - `createdBy` / `updatedBy` — filter by creator or updater user ID.
 * - `createdAfter` / `createdBefore` — filter by creation timestamp range.
 * - `statusAfter` / `statusBefore` — filter by status timestamp range.
 * - `keyword` — searches `order_number` and optionally `note`.
 * - `_restrictKeywordToOrderNumberOnly` — if true, limits keyword search to `order_number` only.
 *
 * @param {Object} filters - An object containing filtering criteria.
 * @param {string} [filters.orderNumber] - Partial match on order number.
 * @param {string|string[]} [filters.orderTypeId] - One or many order_type_id values.
 * @param {string} [filters.orderStatusId] - Exact match, overridden by _activeStatusId.
 * @param {string} [filters._activeStatusId] - Internal override for filtering only active statuses.
 * @param {string} [filters.createdBy] - User ID filter (creator).
 * @param {string} [filters.updatedBy] - User ID filter (updater).
 * @param {string} [filters.createdAfter] - Records created after this date.
 * @param {string} [filters.createdBefore] - Records created before this date.
 * @param {string} [filters.statusAfter] - status_date >= this.
 * @param {string} [filters.statusBefore] - status_date <= this.
 * @param {string} [filters.keyword] - Keyword search (order_number, optionally note).
 * @param {boolean} [filters._restrictKeywordToOrderNumberOnly=false] - Limit keyword search to order_number only.
 * @returns {{ whereClause: string, params: any[] }} - SQL WHERE clause string and parameters array.
 *
 * @example
 * const { whereClause, params } = buildOrderFilter({
 *   orderTypeId: ['a1', 'b2'],
 *   createdAfter: '2024-01-01',
 *   keyword: 'NMN',
 * });
 *
 * // WHERE o.order_type_id IN ($1, $2) AND o.created_at >= $3 AND (o.order_number ILIKE $4 OR o.note ILIKE $4)
 * // params: ['a1', 'b2', '2024-01-01', '%NMN%']
 *
 * @throws {AppError} If filter parsing or clause construction fails.
 */
const buildOrderFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.orderNumber) {
      conditions.push(`o.order_number ILIKE $${paramIndex}`);
      params.push(`%${filters.orderNumber}%`);
      paramIndex++;
    }
    
    if (filters.orderTypeId) {
      if (Array.isArray(filters.orderTypeId)) {
        const placeholders = filters.orderTypeId.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`o.order_type_id IN (${placeholders})`);
        params.push(...filters.orderTypeId);
      } else {
        conditions.push(`o.order_type_id = $${paramIndex}`);
        params.push(filters.orderTypeId);
        paramIndex++;
      }
    }
    
    if (filters._activeStatusId) {
      conditions.push(`o.order_status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    } else if (filters.orderStatusId) {
      conditions.push(`o.order_status_id = $${paramIndex}`);
      params.push(filters.orderStatusId);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`o.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`o.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    if (filters.createdAfter) {
      conditions.push(`o.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`o.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    if (filters.statusAfter) {
      conditions.push(`o.status_date >= $${paramIndex}`);
      params.push(filters.statusAfter);
      paramIndex++;
    }
    
    if (filters.statusBefore) {
      conditions.push(`o.status_date <= $${paramIndex}`);
      params.push(filters.statusBefore);
      paramIndex++;
    }
    
    if (filters.keyword) {
      const keyword = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;
      if (filters._restrictKeywordToOrderNumberOnly) {
        conditions.push(`o.order_number ILIKE $${paramIndex}`);
        params.push(keyword);
        paramIndex++;
      } else {
        conditions.push(`(o.order_number ILIKE $${paramIndex} OR o.note ILIKE $${paramIndex})`);
        params.push(keyword);
        paramIndex++;
      }
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build order filter', {
      context: 'order-repository/buildOrderFilter',
      error: err.message,
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare order filter', {
      details: err.message,
      stage: 'build-order-where-clause',
    });
  }
};

module.exports = {
  buildOrderFilter,
};
