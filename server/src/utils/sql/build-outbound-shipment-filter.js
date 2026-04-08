/**
 * @file build-outbound-shipment-filter.js
 * @description SQL WHERE clause builder for outbound shipment queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildOutboundShipmentFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for outbound shipment queries.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.statusIds]          - Filter by shipment status UUIDs.
 * @param {string[]} [filters.warehouseIds]        - Filter by warehouse UUIDs.
 * @param {string[]} [filters.deliveryMethodIds]   - Filter by delivery method UUIDs.
 * @param {string}   [filters.createdBy]           - Filter by creator UUID.
 * @param {string}   [filters.updatedBy]           - Filter by updater UUID.
 * @param {string}   [filters.createdAfter]        - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]       - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.shippedAfter]        - Lower bound for shipped_at (inclusive, UTC).
 * @param {string}   [filters.shippedBefore]       - Upper bound for shipped_at (exclusive, UTC).
 * @param {string}   [filters.orderId]             - Filter by order UUID.
 * @param {string}   [filters.orderNumber]         - ILIKE filter on order number.
 * @param {string}   [filters.keyword]             - Fuzzy search across order number, warehouse, delivery method.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildOutboundShipmentFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'shippedAfter', 'shippedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Shipment ────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`os.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.warehouseIds?.length) {
    conditions.push(`os.warehouse_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.warehouseIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.deliveryMethodIds?.length) {
    conditions.push(`os.delivery_method_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.deliveryMethodIds);
    paramIndexRef.value++;
  }
  
  // ─── Audit ──────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`os.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`os.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date Range ─────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions, params,
    column:        'os.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions, params,
    column:        'os.shipped_at',
    after:         normalizedFilters.shippedAfter,
    before:        normalizedFilters.shippedBefore,
    paramIndexRef,
  });
  
  // ─── Order ───────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.orderId) {
    conditions.push(`os.order_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.orderId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.orderNumber) {
    conditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.orderNumber}%`);
    paramIndexRef.value++;
  }
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced three times — single param covers all columns.
  if (normalizedFilters.keyword) {
    conditions.push(`(
      o.order_number  ILIKE $${paramIndexRef.value} OR
      w.name          ILIKE $${paramIndexRef.value} OR
      dm.method_name  ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildOutboundShipmentFilter,
};
