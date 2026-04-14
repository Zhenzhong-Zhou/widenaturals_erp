/**
 * @file warehouse-inventory-filter.js
 * @description
 * Parameterised WHERE clause builder for warehouse inventory queries.
 *
 * Always scoped to a single warehouse. Supports exact-match filters for
 * status, batch type, SKU, product, and packaging material; date range
 * filtering on inbound_date; a boolean reserved-quantity flag; and a
 * multi-field ILIKE keyword search.
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
 * Always scoped to a single warehouse via `warehouseId` (required).
 *
 * @param {object}  [filters={}]
 * @param {string}  filters.warehouseId       - Warehouse UUID (required scope).
 * @param {string}  [filters.statusId]        - Filter by inventory status UUID.
 * @param {string}  [filters.skuId]           - Filter by SKU UUID.
 * @param {string}  [filters.productId]       - Filter by product UUID.
 * @param {string}  [filters.inboundDateAfter]  - Lower bound for inbound_date (inclusive, UTC).
 * @param {string}  [filters.inboundDateBefore] - Upper bound for inbound_date (inclusive, UTC).
 * @param {boolean} [filters.hasReserved]     - true = reserved > 0, false = reserved = 0.
 * @param {string}  [filters.search]          - ILIKE search across lot_number, product name, sku_code.
 * @param {string}  [filters.batchType]             - Filter by batch type ('product' | 'packaging_material').
 * @param {string}  [filters.packagingMaterialId]   - Filter by packaging material UUID.
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
  
  // ─── Warehouse scope (always applied) ────────────────────────────────────────
  
  conditions.push(`wi.warehouse_id = $${paramIndexRef.value++}`);
  params.push(normalizedFilters.warehouseId);
  
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
