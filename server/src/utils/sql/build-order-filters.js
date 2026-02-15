/**
 * @fileoverview
 * Utility to dynamically build a SQL `WHERE` clause and parameter array
 * for safely querying the `orders` table using flexible filters.
 *
 * Supports filtering by:
 * - Order number (partial match)
 * - Order type ID (exact or multiple)
 * - Order status ID(s) (single, array, or override via `_activeStatusId`)
 * - Audit fields (`created_by`, `updated_by`)
 * - Date ranges (`created_at`, `status_date`)
 * - Keyword search (`order_number` and/or `note`)
 * - Internal flags for advanced behavior
 *
 * Output is designed to be safely used with `pg` parameterized queries (e.g., `pg.query`).
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a SQL `WHERE` clause and parameter array from a dynamic filters object
 * to query the `orders` table (aliased as `o`) securely.
 *
 * Converts a flexible set of filters into a SQL-safe clause with numbered parameters,
 * compatible with `pg` parameterized queries.
 *
 * @param {Object} filters - Filtering criteria.
 * @param {string} [filters.orderNumber] - Partial match using `ILIKE '%...%'`.
 * @param {string|string[]} [filters.orderTypeId] - UUID(s); supports `=` or `IN (...)`.
 * @param {string} [filters.orderStatusId] - Exact match, unless `_activeStatusId` is present.
 * @param {string|string[]} [filters.orderStatusIds] - One or more allowed status IDs (`=` or `ANY(...)`).
 * @param {string} [filters._activeStatusId] - Overrides `orderStatusId` for enforced filtering.
 * @param {string} [filters.createdBy] - User ID of the creator.
 * @param {string} [filters.updatedBy] - User ID of the updater.
 * @param {string} [filters.createdAfter] - Filter by `created_at >=` date.
 * @param {string} [filters.createdBefore] - Filter by `created_at <=` date.
 * @param {string} [filters.statusAfter] - Filter by `status_date >=` date.
 * @param {string} [filters.statusBefore] - Filter by `status_date <=` date.
 * @param {string} [filters.keyword] - Keyword search for `order_number` and/or `note`.
 * @param {boolean} [filters._restrictKeywordToOrderNumberOnly=false] - If true, restricts keyword match to `order_number` only.
 *
 * @returns {{ whereClause: string, params: any[] }} SQL WHERE clause and parameter list.
 *
 * @example
 * const { whereClause, params } = buildOrderFilter({
 *   orderTypeId: ['a1', 'b2'],
 *   createdAfter: '2024-01-01',
 *   keyword: 'gut health',
 * });
 *
 * // Output:
 * // whereClause → "... AND o.created_at >= $1 AND (o.order_number ILIKE $2 OR o.note ILIKE $2)"
 * // params → ['2024-01-01', '%gut health%']
 *
 * @throws {AppError} If clause generation fails.
 */
const buildOrderFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );
    filters = normalizeDateRangeFilters(filters, 'statusAfter', 'statusBefore');

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    if (filters.orderNumber) {
      conditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.orderNumber}%`);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Order type (single or multiple)
    // ------------------------------
    if (filters.orderTypeId) {
      if (Array.isArray(filters.orderTypeId)) {
        const placeholders = filters.orderTypeId.map(
          () => `$${paramIndexRef.value++}`
        );
        conditions.push(`o.order_type_id IN (${placeholders.join(', ')})`);
        params.push(...filters.orderTypeId);
      } else {
        conditions.push(`o.order_type_id = $${paramIndexRef.value}`);
        params.push(filters.orderTypeId);
        paramIndexRef.value++;
      }
    }

    // ------------------------------
    // Status enforcement / fallback
    // ------------------------------
    if (filters._activeStatusId) {
      conditions.push(`o.order_status_id = $${paramIndexRef.value}`);
      params.push(filters._activeStatusId);
      paramIndexRef.value++;
    } else if (filters.orderStatusId) {
      conditions.push(`o.order_status_id = $${paramIndexRef.value}`);
      params.push(filters.orderStatusId);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Explicit status list override
    // ------------------------------
    if (filters.orderStatusIds !== undefined) {
      if (Array.isArray(filters.orderStatusIds)) {
        conditions.push(`o.order_status_id = ANY($${paramIndexRef.value})`);
      } else {
        conditions.push(`o.order_status_id = $${paramIndexRef.value}`);
      }
      params.push(filters.orderStatusIds);
      paramIndexRef.value++;
    }

    if (filters.createdBy) {
      conditions.push(`o.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`o.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Created / Status date filters
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'o.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'o.status_date',
      after: filters.statusAfter,
      before: filters.statusBefore,
      paramIndexRef,
    });

    // ------------------------------
    // Keyword search
    // ------------------------------
    if (filters.keyword) {
      const keyword = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;

      if (filters._restrictKeywordToOrderNumberOnly) {
        conditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
        params.push(keyword);
        paramIndexRef.value++;
      } else {
        conditions.push(
          `(o.order_number ILIKE $${paramIndexRef.value} OR o.note ILIKE $${paramIndexRef.value})`
        );
        params.push(keyword);
        paramIndexRef.value++;
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
