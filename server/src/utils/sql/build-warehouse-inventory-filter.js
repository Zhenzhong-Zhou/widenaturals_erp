/**
 * @file warehouse-inventory-filter.js
 * @description
 * Parameterised WHERE clause builder for warehouse inventory queries.
 *
 * Supports both single-warehouse scope (warehouseId) and cross-warehouse
 * scope (warehouseIds array) for admin views. Includes exact-match filters
 * for status, batch type, SKU, product, and packaging material; low stock
 * threshold and expiry window alert filters; date range filtering on
 * inbound_date; a boolean reserved-quantity flag; and a multi-field ILIKE
 * keyword search.
 *
 * Exports:
 *  - buildWarehouseInventoryFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for warehouse inventory queries.
 *
 * Warehouse scope is required unless cross-warehouse access is granted.
 * Single warehouse uses `warehouseId`, cross-warehouse restricted users
 * receive `warehouseIds` array from ACL rules.
 *
 * @param {object}   [filters={}]
 * @param {string}   [filters.warehouseId]           - Single warehouse UUID scope.
 * @param {string[]} [filters.warehouseIds]           - Multiple warehouse UUIDs (ACL-injected for cross-warehouse).
 * @param {string}   [filters.statusId]               - Filter by inventory status UUID.
 * @param {string}   [filters.batchType]              - Filter by batch type ('product' | 'packaging_material').
 * @param {string}   [filters.skuId]                  - Filter by SKU UUID.
 * @param {string}   [filters.productId]              - Filter by product UUID.
 * @param {string}   [filters.packagingMaterialId]    - Filter by packaging material UUID.
 * @param {number}   [filters.lowStockThreshold]      - Return records where available quantity <= threshold.
 * @param {number}   [filters.expiringWithinDays]     - Return records expiring within N days from today.
 * @param {string}   [filters.inboundDateAfter]       - Lower bound for inbound_date (inclusive, UTC).
 * @param {string}   [filters.inboundDateBefore]      - Upper bound for inbound_date (inclusive, UTC).
 * @param {boolean}  [filters.hasReserved]            - true = reserved > 0, false = reserved = 0.
 * @param {string}   [filters.search]                 - ILIKE search across lot_number, product name, SKU, material code.
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildWarehouseInventoryFilter = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters, 'inboundDateAfter', 'inboundDateBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };

// ─── Warehouse scope ────────────────────────────────────────────────────────
  
  if (normalizedFilters.warehouseId) {
    conditions.push(`wi.warehouse_id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.warehouseId);
  } else if (normalizedFilters.warehouseIds?.length) {
    conditions.push(`wi.warehouse_id = ANY($${paramIndexRef.value++}::uuid[])`);
    params.push(normalizedFilters.warehouseIds);
  }
  
  // ─── Exact-match filters ─────────────────────────────────────────────────────
  
  if (normalizedFilters.statusId) {
    conditions.push(`wi.status_id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.statusId);
  }
  
  if (normalizedFilters.batchType) {
    conditions.push(`br.batch_type = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.batchType);
  }
  
  if (normalizedFilters.skuId) {
    conditions.push(`pb.sku_id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.skuId);
  }
  
  if (normalizedFilters.productId) {
    conditions.push(`p.id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.productId);
  }
  
  if (normalizedFilters.packagingMaterialId) {
    conditions.push(`pm.id = $${paramIndexRef.value++}`);
    params.push(normalizedFilters.packagingMaterialId);
  }
  
  if (normalizedFilters.lowStockThreshold != null) {
    conditions.push(
      `(wi.warehouse_quantity - wi.reserved_quantity) <= $${paramIndexRef.value++}`
    );
    params.push(normalizedFilters.lowStockThreshold);
  }
  
  if (normalizedFilters.expiringWithinDays != null) {
    conditions.push(
      `COALESCE(pb.expiry_date, pmb.expiry_date) <= (CURRENT_DATE + $${paramIndexRef.value++} * INTERVAL '1 day')`
    );
    params.push(normalizedFilters.expiringWithinDays);
  }
  
  // ─── Date range ──────────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'wi.inbound_date',
    after:         normalizedFilters.inboundDateAfter,
    before:        normalizedFilters.inboundDateBefore,
    paramIndexRef,
  });
  
  // ─── Boolean filter ──────────────────────────────────────────────────────────
  
  if (normalizedFilters.hasReserved === true) {
    conditions.push('wi.reserved_quantity > 0');
  } else if (normalizedFilters.hasReserved === false) {
    conditions.push('wi.reserved_quantity = 0');
  }
  
  // ─── Search (must remain last) ──────────────────────────────────────────────
  
  if (normalizedFilters.search) {
    conditions.push(`(
      pb.lot_number           ILIKE $${paramIndexRef.value} OR
      pmb.lot_number          ILIKE $${paramIndexRef.value} OR
      pmb.received_label_name ILIKE $${paramIndexRef.value} OR
      p.name                  ILIKE $${paramIndexRef.value} OR
      s.sku                   ILIKE $${paramIndexRef.value} OR
      pm.code                 ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.search}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildWarehouseInventoryFilter,
};
