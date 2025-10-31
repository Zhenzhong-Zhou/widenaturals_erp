/**
 * @fileoverview
 * Utility to dynamically build a SQL `WHERE` clause and parameter array
 * for querying the `order_fulfillments` table with flexible filters.
 *
 * Supports filtering by:
 * - Order ID
 * - Fulfillment ID(s)
 * - Allocation ID(s)
 *
 * Output is designed to be safely used with `pg` parameterized queries.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a SQL `WHERE` clause and parameter array for `order_fulfillments` (aliased as `f`).
 *
 * @param {Object} filters - Filtering criteria.
 * @param {string} [filters.orderId] - Order UUID.
 * @param {string|string[]} [filters.fulfillmentIds] - Single ID or array of IDs.
 * @param {string|string[]} [filters.allocationIds] - Single ID or array of allocation IDs.
 *
 * @returns {{ whereClause: string, params: any[] }} SQL WHERE clause and parameter list.
 *
 * @example
 * const { whereClause, params } = buildFulfillmentFilter({
 *   orderId: 'order-uuid',
 *   fulfillmentIds: ['ful-1', 'ful-2'],
 * });
 *
 * // Output:
 * // whereClause → "1=1 AND f.order_id = $1 AND f.id = ANY($2)"
 * // params → ['order-uuid', ['ful-1', 'ful-2']]
 */
const buildFulfillmentFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.orderId) {
      conditions.push(`oi.order_id = $${paramIndex}`);
      params.push(filters.orderId);
      paramIndex++;
    }
    
    if (filters.fulfillmentIds) {
      if (Array.isArray(filters.fulfillmentIds)) {
        conditions.push(`f.id = ANY($${paramIndex})`);
        params.push(filters.fulfillmentIds);
      } else {
        conditions.push(`f.id = $${paramIndex}`);
        params.push(filters.fulfillmentIds);
      }
      paramIndex++;
    }
    
    if (filters.allocationIds) {
      if (Array.isArray(filters.allocationIds)) {
        conditions.push(`f.allocation_id = ANY($${paramIndex})`);
        params.push(filters.allocationIds);
      } else {
        conditions.push(`f.allocation_id = $${paramIndex}`);
        params.push(filters.allocationIds);
      }
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build fulfillment filter', {
      context: 'fulfillment-repository/buildFulfillmentFilter',
      error: err.message,
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare fulfillment filter', {
      details: err.message,
      stage: 'build-fulfillment-where-clause',
    });
  }
};

module.exports = {
  buildFulfillmentFilter,
};
