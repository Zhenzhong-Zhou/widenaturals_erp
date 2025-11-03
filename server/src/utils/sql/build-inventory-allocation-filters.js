/**
 * @fileoverview
 * SQL filter builder for inventory allocation dashboards, reports, and APIs.
 *
 * This module exports a single function `buildInventoryAllocationFilter` that constructs
 * safe, parameterized SQL WHERE clauses for filtering inventory allocation data.
 *
 * It returns two independent WHERE clause strings:
 * - `rawAllocWhereClause` (for `inventory_allocations ia`)
 * - `outerWhereClause` (for `orders o`, `sales_orders so`, etc.)
 *
 * Common use cases include:
 * - Filterable dashboards
 * - Inventory allocation reports
 * - CTE subqueries joined with orders, batches, and customers
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds parameterized SQL WHERE clauses for filtering inventory allocation data.
 *
 * ### Supported Filters
 * - **Allocation-level (`ia`):**
 *   - `statusIds[]` → `ia.status_id = ANY(...)`
 *   - `warehouseIds[]` → `ia.warehouse_id = ANY(...)`
 *   - `batchIds[]` → `ia.batch_id = ANY(...)`
 *   - `allocationCreatedBy` → `ia.created_by`
 *   - `allocatedAfter` / `allocatedBefore` → `ia.allocated_at >=` / `<=`
 *
 * - **Aggregated-level (`aa`):**
 *   - `aggregatedAllocatedAfter` / `aggregatedAllocatedBefore` → `aa.allocated_at >=` / `<=`
 *   - `aggregatedCreatedAfter` / `aggregatedCreatedBefore` → `aa.allocated_created_at >=` / `<=`
 *
 * - **Order-level (`o`):**
 *   - `orderNumber` (ILIKE match) → `o.order_number`
 *   - `orderStatusId` → `o.order_status_id`
 *   - `orderTypeId` → `o.order_type_id`
 *   - `orderCreatedBy` → `o.created_by`
 *
 * - **Sales order-level (`so`):**
 *   - `paymentStatusId` → `so.payment_status_id`
 *
 * - **Keyword search (ILIKE fuzzy match):**
 *   - `keyword` matches both:
 *     - `o.order_number`
 *     - `c.firstname || ' ' || c.lastname`
 *
 * ### Return Value
 * Returns both:
 * - `rawAllocWhereClause` and `rawAllocParams`: for inner `inventory_allocations ia` queries
 * - `outerWhereClause` and `outerParams`: for top-level `orders`, `sales_orders`, `customers`, etc.
 *
 * ### Example
 * ```ts
 * const {
 *   rawAllocWhereClause,
 *   rawAllocParams,
 *   outerWhereClause,
 *   outerParams,
 * } = buildInventoryAllocationFilter({
 *   statusIds: ['status-uuid'],
 *   allocatedAfter: '2024-01-01',
 *   keyword: 'John',
 * });
 *
 * // rawAllocWhereClause: "1=1 AND ia.status_id = ANY($1) AND ia.allocated_at >= $2"
 * // outerWhereClause: "1=1 AND (
 * //   o.order_number ILIKE $3 OR
 * //   COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $3
 * // )"
 * // params: ['status-uuid[]', '2024-01-01', '%John%']
 * ```
 *
 * @param {Object} [filters={}] - Filtering criteria
 * @param {string[]} [filters.statusIds] - Allocation status IDs
 * @param {string[]} [filters.warehouseIds] - Warehouse IDs
 * @param {string[]} [filters.batchIds] - Batch IDs
 * @param {string} [filters.allocationCreatedBy] - Allocation creator (user ID)
 * @param {string} [filters.allocatedAfter] - Allocation timestamp (ISO string, inclusive lower bound)
 * @param {string} [filters.allocatedBefore] - Allocation timestamp (ISO string, inclusive upper bound)
 * @param {string} [filters.aggregatedAllocatedAfter] - Aggregated allocation date lower bound
 * @param {string} [filters.aggregatedAllocatedBefore] - Aggregated allocation date upper bound
 * @param {string} [filters.aggregatedCreatedAfter] - Aggregated created date lower bound
 * @param {string} [filters.aggregatedCreatedBefore] - Aggregated created date upper bound
 * @param {string} [filters.orderNumber] - Order number (ILIKE match)
 * @param {string} [filters.orderStatusId] - Order status ID
 * @param {string} [filters.orderTypeId] - Order type ID
 * @param {string} [filters.orderCreatedBy] - Order creator (user ID)
 * @param {string} [filters.paymentStatusId] - Payment status ID
 * @param {string} [filters.keyword] - Free-text match (order number or customer name)
 *
 * @returns {{
 *   rawAllocWhereClause: string,
 *   rawAllocParams: any[],
 *   outerWhereClause: string,
 *   outerParams: any[]
 * }} SQL-safe WHERE clauses and parameters
 *
 * @throws {AppError} If filter generation fails
 */
const buildInventoryAllocationFilter = (filters = {}) => {
  try {
    const rawAllocConditions = ['1=1'];
    const outerConditions = ['1=1'];
    const rawAllocParams = [];
    const outerParams = [];

    // --- RAW allocation-level filters ---
    let rawIndex = 1;

    if (filters.statusIds?.length) {
      rawAllocConditions.push(`ia.status_id = ANY($${rawIndex}::uuid[])`);
      rawAllocParams.push(filters.statusIds);
      rawIndex++;
    }

    if (filters.warehouseIds?.length) {
      rawAllocConditions.push(`ia.warehouse_id = ANY($${rawIndex}::uuid[])`);
      rawAllocParams.push(filters.warehouseIds);
      rawIndex++;
    }

    if (filters.batchIds?.length) {
      rawAllocConditions.push(`ia.batch_id = ANY($${rawIndex}::uuid[])`);
      rawAllocParams.push(filters.batchIds);
      rawIndex++;
    }

    if (filters.allocationCreatedBy) {
      rawAllocConditions.push(`ia.created_by = $${rawIndex}`);
      rawAllocParams.push(filters.allocationCreatedBy);
      rawIndex++;
    }

    if (filters.allocatedAfter) {
      rawAllocConditions.push(`ia.allocated_at >= $${rawIndex}`);
      rawAllocParams.push(filters.allocatedAfter);
      rawIndex++;
    }

    if (filters.allocatedBefore) {
      rawAllocConditions.push(`ia.allocated_at <= $${rawIndex}`);
      rawAllocParams.push(filters.allocatedBefore);
      rawIndex++;
    }

    // --- OUTER order-level filters ---
    // Start outerIndex *after* rawAllocParams
    let outerIndex = rawIndex;

    if (filters.aggregatedAllocatedAfter) {
      outerConditions.push(`aa.allocated_at >= $${outerIndex}`);
      outerParams.push(filters.aggregatedAllocatedAfter);
      outerIndex++;
    }

    if (filters.aggregatedAllocatedBefore) {
      outerConditions.push(`aa.allocated_at <= $${outerIndex}`);
      outerParams.push(filters.aggregatedAllocatedBefore);
      outerIndex++;
    }

    if (filters.aggregatedCreatedAfter) {
      outerConditions.push(`aa.allocated_created_at >= $${outerIndex}`);
      outerParams.push(filters.aggregatedCreatedAfter);
      outerIndex++;
    }

    if (filters.aggregatedCreatedBefore) {
      outerConditions.push(`aa.allocated_created_at <= $${outerIndex}`);
      outerParams.push(filters.aggregatedCreatedBefore);
      outerIndex++;
    }

    if (filters.orderNumber) {
      outerConditions.push(`o.order_number ILIKE $${outerIndex}`);
      outerParams.push(`%${filters.orderNumber}%`);
      outerIndex++;
    }

    if (filters.orderStatusId) {
      outerConditions.push(`o.order_status_id = $${outerIndex}`);
      outerParams.push(filters.orderStatusId);
      outerIndex++;
    }

    if (filters.orderTypeId) {
      outerConditions.push(`o.order_type_id = $${outerIndex}`);
      outerParams.push(filters.orderTypeId);
      outerIndex++;
    }

    if (filters.orderCreatedBy) {
      outerConditions.push(`o.created_by = $${outerIndex}`);
      outerParams.push(filters.orderCreatedBy);
      outerIndex++;
    }

    if (filters.paymentStatusId) {
      outerConditions.push(`so.payment_status_id = $${outerIndex}`);
      outerParams.push(filters.paymentStatusId);
      outerIndex++;
    }

    if (filters.keyword) {
      outerConditions.push(`(
      o.order_number ILIKE $${outerIndex} OR
      COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $${outerIndex}
    )`);
      outerParams.push(`%${filters.keyword}%`);
      outerIndex++;
    }

    return {
      rawAllocWhereClause: rawAllocConditions.join(' AND '),
      rawAllocParams,
      outerWhereClause: outerConditions.join(' AND '),
      outerParams,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build inventory allocation filter', {
      context: 'allocation-repository/buildInventoryAllocationFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError(
      'Failed to prepare inventory allocation filter',
      {
        details: err.message,
        stage: 'build-inventory-allocation-where-clause',
      }
    );
  }
};

module.exports = {
  buildInventoryAllocationFilter,
};
