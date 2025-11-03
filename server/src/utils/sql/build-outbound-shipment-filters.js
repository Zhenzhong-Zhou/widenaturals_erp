/**
 * @fileoverview
 * Outbound shipment SQL filter builder.
 *
 * This module centralizes the logic for constructing parameterized SQL `WHERE` clauses
 * for querying `outbound_shipments` along with their related joins (`orders`, `warehouses`,
 * `delivery_methods`). It ensures safe, reusable, and auditable query generation for:
 *
 * - Outbound shipment dashboards
 * - Reports
 * - API endpoints with complex filter options
 *
 * The builder:
 * - Accepts structured filter input (e.g., UUID arrays, date ranges, keyword search).
 * - Generates SQL-safe `WHERE` clauses and positional parameter arrays.
 * - Supports fuzzy keyword matching across order number, warehouse name, and delivery method.
 *
 * This approach avoids string concatenation vulnerabilities and ensures all queries
 * are consistent across repositories/services.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a parameterized SQL `WHERE` clause for outbound shipment queries.
 *
 * ### Supported Filters
 * - **Shipment-level (`os`):**
 *   - `statusIds[]` → filter by status UUID(s)
 *   - `warehouseIds[]` → filter by warehouse UUID(s)
 *   - `deliveryMethodIds[]` → filter by delivery method UUID(s)
 *   - `createdBy`, `updatedBy` → filter by user UUID
 *   - `createdAfter`, `createdBefore` → filter by creation date range
 *   - `shippedAfter`, `shippedBefore` → filter by shipped date range
 *
 * - **Order-level (`o`):**
 *   - `orderId` → filter by order UUID
 *   - `orderNumber` → case-insensitive partial match
 *
 * - **Keyword search:**
 *   - Fuzzy match across `o.order_number`, `w.name`, `dm.method_name`
 *
 * ### Example
 * ```js
 * const { whereClause, params } = buildOutboundShipmentFilter({
 *   statusIds: ['uuid-1', 'uuid-2'],
 *   orderNumber: 'SO-2025',
 *   keyword: 'Toronto',
 * });
 *
 * // whereClause =>
 * // "1=1 AND os.status_id = ANY($1::uuid[]) AND o.order_number ILIKE $2
 * //  AND (o.order_number ILIKE $3 OR w.name ILIKE $3 OR dm.method_name ILIKE $3)"
 *
 * // params => [ ['uuid-1', 'uuid-2'], '%SO-2025%', '%Toronto%' ]
 * ```
 *
 * @param {Object} [filters={}] - Filtering criteria
 * @param {string[]} [filters.statusIds] - Shipment status IDs
 * @param {string[]} [filters.warehouseIds] - Warehouse IDs
 * @param {string[]} [filters.deliveryMethodIds] - Delivery method IDs
 * @param {string} [filters.createdBy] - User ID who created shipment
 * @param {string} [filters.updatedBy] - User ID who last updated shipment
 * @param {string} [filters.createdAfter] - Lower bound for created_at (ISO date string)
 * @param {string} [filters.createdBefore] - Upper bound for created_at (ISO date string)
 * @param {string} [filters.shippedAfter] - Lower bound for shipped_at (ISO date string)
 * @param {string} [filters.shippedBefore] - Upper bound for shipped_at (ISO date string)
 * @param {string} [filters.orderId] - Order ID
 * @param {string} [filters.orderNumber] - Partial order number match
 * @param {string} [filters.keyword] - Fuzzy match across order number, warehouse, delivery method
 *
 * @returns {{ whereClause: string, params: any[] }} SQL-safe WHERE clause and params array
 *
 * @throws {AppError} If clause generation fails
 */
const buildOutboundShipmentFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;

    // Shipment-level filters
    if (filters.statusIds?.length) {
      conditions.push(`os.status_id = ANY($${idx}::uuid[])`);
      params.push(filters.statusIds);
      idx++;
    }

    if (filters.warehouseIds?.length) {
      conditions.push(`os.warehouse_id = ANY($${idx}::uuid[])`);
      params.push(filters.warehouseIds);
      idx++;
    }

    if (filters.deliveryMethodIds?.length) {
      conditions.push(`os.delivery_method_id = ANY($${idx}::uuid[])`);
      params.push(filters.deliveryMethodIds);
      idx++;
    }

    if (filters.createdBy) {
      conditions.push(`os.created_by = $${idx}`);
      params.push(filters.createdBy);
      idx++;
    }

    if (filters.updatedBy) {
      conditions.push(`os.updated_by = $${idx}`);
      params.push(filters.updatedBy);
      idx++;
    }

    if (filters.createdAfter) {
      conditions.push(`os.created_at >= $${idx}`);
      params.push(filters.createdAfter);
      idx++;
    }

    if (filters.createdBefore) {
      conditions.push(`os.created_at <= $${idx}`);
      params.push(filters.createdBefore);
      idx++;
    }

    if (filters.shippedAfter) {
      conditions.push(`os.shipped_at >= $${idx}`);
      params.push(filters.shippedAfter);
      idx++;
    }

    if (filters.shippedBefore) {
      conditions.push(`os.shipped_at <= $${idx}`);
      params.push(filters.shippedBefore);
      idx++;
    }

    // Order-level
    if (filters.orderId) {
      conditions.push(`os.order_id = $${idx}`);
      params.push(filters.orderId);
      idx++;
    }

    if (filters.orderNumber) {
      conditions.push(`o.order_number ILIKE $${idx}`);
      params.push(`%${filters.orderNumber}%`);
      idx++;
    }

    // Keyword search (fuzzy match across multiple cols)
    if (filters.keyword) {
      conditions.push(`(
        o.order_number ILIKE $${idx} OR
        w.name ILIKE $${idx} OR
        dm.method_name ILIKE $${idx}
      )`);
      params.push(`%${filters.keyword}%`);
      idx++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build outbound shipment filter', {
      context: 'outbound-repository/buildOutboundShipmentFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare outbound shipment filter', {
      details: err.message,
      stage: 'build-outbound-shipment-where-clause',
    });
  }
};

module.exports = {
  buildOutboundShipmentFilter,
};
