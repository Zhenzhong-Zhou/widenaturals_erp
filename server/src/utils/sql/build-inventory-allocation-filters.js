/**
 * @fileoverview
 * SQL filter builder for inventory allocation dashboards, reports, and APIs.
 * Constructs a dynamic and parameterized SQL `WHERE` clause string and
 * corresponding parameter array, based on supported filter fields.
 *
 * Useful for paginated inventory allocation queries where filtering across
 * allocation, order, and customer metadata is required.
 *
 * Filters are safely parameterized (e.g., `$1`, `$2`) to prevent SQL injection.
 * Compatible with multi-CTE query structures, such as those using `inventory_allocations ia`,
 * `orders o`, and optionally `sales_orders so`, `customers c`, `aggregated_allocations aa`, etc.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a parameterized SQL WHERE clause for filtering inventory allocations.
 *
 * ### Supported Filters
 * - **Allocation-level (`ia`):**
 *   - `statusId` → `ia.status_id`
 *   - `warehouseId` → `ia.warehouse_id`
 *   - `batchId` → `ia.batch_id`
 *   - `allocationCreatedBy` → `ia.created_by`
 *   - `allocatedAfter` → `ia.allocated_at >=`
 *   - `allocatedBefore` → `ia.allocated_at <=`
 *
 * - **Aggregated allocation-level (`aa`):**
 *   - `aggregatedAllocatedAfter` → `aa.allocated_at >=`
 *   - `aggregatedAllocatedBefore` → `aa.allocated_at <=`
 *   - `aggregatedCreatedAfter` → `aa.allocated_created_at >=`
 *   - `aggregatedCreatedBefore` → `aa.allocated_created_at <=`
 *
 * - **Order-level (`o`):**
 *   - `orderNumber` (partial match, ILIKE) → `o.order_number`
 *   - `orderStatusId` → `o.order_status_id`
 *   - `orderTypeId` → `o.order_type_id`
 *   - `orderCreatedBy` → `o.created_by`
 *
 * - **Sales order-level (`so`):**
 *   - `paymentStatusId` → `so.payment_status_id`
 *
 * - **Keyword (partial match on multiple fields):**
 *   - `keyword` (ILIKE match on:
 *     - `o.order_number`
 *     - full customer name: `c.firstname || ' ' || c.lastname`)
 *
 * ### Usage
 * Returns an object with:
 * - `whereClause`: a safe SQL string (e.g., `ia.status_id = $1 AND o.order_number ILIKE $2`)
 * - `params`: array of values to bind to SQL placeholders (e.g., `['status-uuid', '%SO-202509%']`)
 *
 * Can be used in raw SQL or passed into query builders like `pg`, `knex.raw`, or `pg-promise`.
 *
 * ### Example
 * ```js
 * const { whereClause, params } = buildInventoryAllocationFilter({
 *   statusId: 'status-uuid',
 *   aggregatedAllocatedAfter: '2024-01-01',
 *   keyword: 'John',
 * });
 * // whereClause =>
 * //   "1=1 AND ia.status_id = $1 AND aa.allocated_at >= $2 AND (
 * //     o.order_number ILIKE $3 OR
 * //     COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $3
 * //   )"
 * // params => ['status-uuid', '2024-01-01', '%John%']
 * ```
 *
 * @param {Object} [filters={}] - Filtering criteria
 * @param {string} [filters.statusId] - Allocation status ID (`ia.status_id`)
 * @param {string} [filters.warehouseId] - Warehouse ID (`ia.warehouse_id`)
 * @param {string} [filters.batchId] - Batch ID (`ia.batch_id`)
 * @param {string} [filters.allocationCreatedBy] - Allocation creator user ID (`ia.created_by`)
 * @param {string} [filters.allocatedAfter] - Allocation timestamp >= (ISO string, `ia.allocated_at`)
 * @param {string} [filters.allocatedBefore] - Allocation timestamp <= (ISO string, `ia.allocated_at`)
 * @param {string} [filters.aggregatedAllocatedAfter] - Aggregated allocation timestamp >= (`aa.allocated_at`)
 * @param {string} [filters.aggregatedAllocatedBefore] - Aggregated allocation timestamp <= (`aa.allocated_at`)
 * @param {string} [filters.aggregatedCreatedAfter] - Aggregated created_at >= (`aa.allocated_created_at`)
 * @param {string} [filters.aggregatedCreatedBefore] - Aggregated created_at <= (`aa.allocated_created_at`)
 * @param {string} [filters.orderNumber] - Order number (partial match, ILIKE, `o.order_number`)
 * @param {string} [filters.orderStatusId] - Order status ID (`o.order_status_id`)
 * @param {string} [filters.orderTypeId] - Order type ID (`o.order_type_id`)
 * @param {string} [filters.orderCreatedBy] - Order creator user ID (`o.created_by`)
 * @param {string} [filters.paymentStatusId] - Payment status ID (`so.payment_status_id`)
 * @param {string} [filters.keyword] - Free-text fuzzy search across order number and customer name
 *
 * @returns {{ whereClause: string, params: any[] }} - Parameterized SQL clause & values
 *
 * @throws {AppError} If building the filter fails due to unexpected input or internal error.
 */
const buildInventoryAllocationFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    // --- Allocation-level filters ---
    if (filters.statusId) {
      conditions.push(`ia.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    }
    
    if (filters.warehouseId) {
      conditions.push(`ia.warehouse_id = $${paramIndex}`);
      params.push(filters.warehouseId);
      paramIndex++;
    }
    
    if (filters.batchId) {
      conditions.push(`ia.batch_id = $${paramIndex}`);
      params.push(filters.batchId);
      paramIndex++;
    }
    
    if (filters.allocationCreatedBy) {
      conditions.push(`ia.created_by = $${paramIndex}`);
      params.push(filters.allocationCreatedBy);
      paramIndex++;
    }
    
    if (filters.allocatedAfter) {
      conditions.push(`ia.allocated_at >= $${paramIndex}`);
      params.push(filters.allocatedAfter);
      paramIndex++;
    }
    
    if (filters.allocatedBefore) {
      conditions.push(`ia.allocated_at <= $${paramIndex}`);
      params.push(filters.allocatedBefore);
      paramIndex++;
    }
    
    if (filters.aggregatedAllocatedAfter) {
      conditions.push(`aa.allocated_at >= $${paramIndex}`);
      params.push(filters.aggregatedAllocatedAfter);
      paramIndex++;
    }
    
    if (filters.aggregatedAllocatedBefore) {
      conditions.push(`aa.allocated_at <= $${paramIndex}`);
      params.push(filters.aggregatedAllocatedBefore);
      paramIndex++;
    }
    
    if (filters.aggregatedCreatedAfter) {
      conditions.push(`aa.allocated_created_at >= $${paramIndex}`);
      params.push(filters.aggregatedCreatedAfter);
      paramIndex++;
    }
    
    if (filters.aggregatedCreatedBefore) {
      conditions.push(`aa.allocated_created_at <= $${paramIndex}`);
      params.push(filters.aggregatedCreatedBefore);
      paramIndex++;
    }
    
    // --- Order-level filters ---
    if (filters.orderNumber) {
      conditions.push(`o.order_number ILIKE $${paramIndex}`);
      params.push(`%${filters.orderNumber}%`);
      paramIndex++;
    }
    
    if (filters.orderStatusId) {
      conditions.push(`o.order_status_id = $${paramIndex}`);
      params.push(filters.orderStatusId);
      paramIndex++;
    }
    
    if (filters.orderTypeId) {
      conditions.push(`o.order_type_id = $${paramIndex}`);
      params.push(filters.orderTypeId);
      paramIndex++;
    }
    
    if (filters.orderCreatedBy) {
      conditions.push(`o.created_by = $${paramIndex}`);
      params.push(filters.orderCreatedBy);
      paramIndex++;
    }
    
    // --- Sales order-level filters ---
    if (filters.paymentStatusId) {
      conditions.push(`so.payment_status_id = $${paramIndex}`);
      params.push(filters.paymentStatusId);
      paramIndex++;
    }
    
    // --- Keywords (multi-field fuzzy search) ---
    if (filters.keyword) {
      const keyword = `%${filters.keyword}%`;
      conditions.push(
        `(
          o.order_number ILIKE $${paramIndex} OR
          COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $${paramIndex}
        )`
      );
      params.push(keyword);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build inventory allocation filter', {
      context: 'allocation-repository/buildInventoryAllocationFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare inventory allocation filter', {
      details: err.message,
      stage: 'build-inventory-allocation-where-clause',
    });
  }
};

module.exports = {
  buildInventoryAllocationFilter,
};
