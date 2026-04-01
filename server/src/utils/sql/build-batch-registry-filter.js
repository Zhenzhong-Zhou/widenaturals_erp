/**
 * @file build-batch-registry-filter.js
 * @description SQL WHERE clause builders for batch registry queries.
 *
 * Two cooperating builders — one for inventory scope filtering (lookup),
 * one for full paginated filtering with date ranges and keyword search.
 *
 * Both are pure functions — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildBatchRegistryInventoryScopeFilter — WHERE clause for inventory scope lookup
 *  - buildBatchRegistryFilter               — WHERE clause for paginated list
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addKeywordIlikeGroup } = require('./sql-helpers');

// ─── Inventory Scope Filter ───────────────────────────────────────────────────

/**
 * Builds a parameterised WHERE clause scoped to inventory availability.
 *
 * Used by getBatchRegistryLookup to surface batches not yet placed in a
 * specific warehouse or location. Conditions use NOT EXISTS subqueries
 * rather than joins to avoid row multiplication from multi-location batches.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.batchType]    - Filter by batch type ('product' | 'packaging_material').
 * @param {string}  [filters.warehouseId]  - Exclude batches already in this warehouse.
 * @param {string}  [filters.locationId]   - Exclude batches already in this location.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildBatchRegistryInventoryScopeFilter = (filters = {}) => {
  const conditions  = ['1=1'];
  const params      = [];
  const paramIndexRef = { value: 1 };
  
  if (filters.batchType) {
    conditions.push(`br.batch_type = $${paramIndexRef.value}`);
    params.push(filters.batchType);
    paramIndexRef.value++;
  }
  
  if (filters.warehouseId) {
    // NOT EXISTS avoids row multiplication from batches placed in multiple locations.
    conditions.push(`
      NOT EXISTS (
        SELECT 1 FROM warehouse_inventory wi
        WHERE wi.batch_id = br.id
          AND wi.warehouse_id = $${paramIndexRef.value}
      )
    `);
    params.push(filters.warehouseId);
    paramIndexRef.value++;
  }
  
  if (filters.locationId) {
    conditions.push(`
      NOT EXISTS (
        SELECT 1 FROM location_inventory li
        WHERE li.batch_id = br.id
          AND li.location_id = $${paramIndexRef.value}
      )
    `);
    params.push(filters.locationId);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

// ─── Paginated List Filter ────────────────────────────────────────────────────

/**
 * Builds a parameterised WHERE clause for paginated batch registry queries.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 * Supports polymorphic filters that apply to both product and packaging batches
 * (e.g. statusIds, lotNumber, expiryAfter/Before).
 *
 * `forceEmptyResult` short-circuits all other conditions and returns a guaranteed
 * zero-row clause — injected by the business layer only when the caller has no
 * visibility into any batch type.
 *
 * The keyword block must remain last — addKeywordIlikeGroup advances the param
 * index internally and does not return the updated value. Any condition added
 * after it would use a stale index.
 *
 * @param {Object}   [filters={}]
 * @param {boolean}  [filters.forceEmptyResult]          - If true, returns zero-row clause immediately.
 * @param {string}   [filters.batchType]                 - Filter by batch type.
 * @param {string[]} [filters.statusIds]                 - Filter by product or packaging batch status UUIDs.
 * @param {string[]} [filters.skuIds]                    - Filter by SKU UUIDs.
 * @param {string[]} [filters.productIds]                - Filter by product UUIDs.
 * @param {string[]} [filters.manufacturerIds]           - Filter by manufacturer UUIDs.
 * @param {string[]} [filters.packagingMaterialIds]      - Filter by packaging material UUIDs.
 * @param {string[]} [filters.supplierIds]               - Filter by supplier UUIDs.
 * @param {string}   [filters.lotNumber]                 - ILIKE search on product and packaging lot numbers.
 * @param {string}   [filters.expiryAfter]               - Lower bound for expiry date (inclusive, UTC).
 * @param {string}   [filters.expiryBefore]              - Upper bound for expiry date (exclusive, UTC).
 * @param {string}   [filters.registeredAfter]           - Lower bound for registered_at (inclusive, UTC).
 * @param {string}   [filters.registeredBefore]          - Upper bound for registered_at (exclusive, UTC).
 * @param {string}   [filters.keyword]                   - Fuzzy keyword search across permission-gated fields.
 * @param {Object}   [filters.keywordCapabilities]       - Permission flags controlling keyword search scope.
 *
 * @returns {{ whereClause: string, params: Array }} Parameterised WHERE clause and bound values.
 */
const buildBatchRegistryFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'expiryAfter', 'expiryBefore'),
    'registeredAfter',
    'registeredBefore'
  );
  
  // Hard fail-closed: injected by the business layer when the caller has no
  // visibility into any batch type. Short-circuits before building any conditions
  // to guarantee zero rows without invalid enum or SQL errors.
  if (normalizedFilters.forceEmptyResult === true) {
    return { whereClause: '1=1 AND 1=0', params: [] };
  }
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Core ───────────────────────────────────────────────────────────────────
  
  if (normalizedFilters.batchType) {
    conditions.push(`br.batch_type = $${paramIndexRef.value}`);
    params.push(normalizedFilters.batchType);
    paramIndexRef.value++;
  }
  
  // ─── Status (polymorphic) ───────────────────────────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    // Same $N referenced twice — PostgreSQL allows a bound parameter to be
    // referenced multiple times in the same query.
    conditions.push(`
      (
        pb.status_id  = ANY($${paramIndexRef.value}::uuid[])
        OR pmb.status_id = ANY($${paramIndexRef.value}::uuid[])
      )
    `);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  // ─── Product Batch ──────────────────────────────────────────────────────────
  
  if (normalizedFilters.skuIds?.length) {
    conditions.push(`s.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.skuIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.productIds?.length) {
    conditions.push(`p.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.productIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.manufacturerIds?.length) {
    conditions.push(`m.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.manufacturerIds);
    paramIndexRef.value++;
  }
  
  // ─── Packaging Batch ────────────────────────────────────────────────────────
  
  if (normalizedFilters.packagingMaterialIds?.length) {
    conditions.push(`pm.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.packagingMaterialIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.supplierIds?.length) {
    conditions.push(`sup.id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.supplierIds);
    paramIndexRef.value++;
  }
  
  // ─── Lot Number (polymorphic ILIKE) ─────────────────────────────────────────
  
  if (normalizedFilters.lotNumber) {
    // Same $N referenced twice — single param covers both batch types.
    conditions.push(`
      (
        pb.lot_number  ILIKE $${paramIndexRef.value}
        OR pmb.lot_number ILIKE $${paramIndexRef.value}
      )
    `);
    params.push(`%${normalizedFilters.lotNumber}%`);
    paramIndexRef.value++;
  }
  
  // ─── Expiry Date (polymorphic) ───────────────────────────────────────────────
  
  if (normalizedFilters.expiryAfter || normalizedFilters.expiryBefore) {
    // Polymorphic — a registry has either a product batch OR a packaging batch,
    // never both. AND would always produce zero rows for single-type registries
    // because the null side fails the comparison.
    if (normalizedFilters.expiryAfter) {
      conditions.push(`
      (
        pb.expiry_date  >= $${paramIndexRef.value}
        OR pmb.expiry_date >= $${paramIndexRef.value}
      )
    `);
      params.push(normalizedFilters.expiryAfter);
      paramIndexRef.value++;
    }
    
    if (normalizedFilters.expiryBefore) {
      conditions.push(`
      (
        pb.expiry_date  < $${paramIndexRef.value}
        OR pmb.expiry_date < $${paramIndexRef.value}
      )
    `);
      params.push(normalizedFilters.expiryBefore);
      paramIndexRef.value++;
    }
  }
  
  // ─── Registry Date ──────────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'br.registered_at',
    after:         normalizedFilters.registeredAfter,
    before:        normalizedFilters.registeredBefore,
    paramIndexRef,
  });
  
  // ─── Keyword Search (must remain last) ──────────────────────────────────────
  
  // addKeywordIlikeGroup advances the param index internally and does not
  // return the updated value — any condition added after this block would
  // use a stale index and produce invalid SQL.
  if (normalizedFilters.keyword && normalizedFilters.keywordCapabilities) {
    const {
      canSearchProduct,
      canSearchSku,
      canSearchManufacturer,
      canSearchPackagingMaterial,
      canSearchSupplier,
    } = normalizedFilters.keywordCapabilities;
    
    const searchableFields = ['pb.lot_number', 'pmb.lot_number'];
    
    if (canSearchProduct)          searchableFields.push('p.name');
    if (canSearchSku)              searchableFields.push('s.sku');
    if (canSearchManufacturer)     searchableFields.push('m.name');
    if (canSearchPackagingMaterial) searchableFields.push('pm.name');
    if (canSearchSupplier)         searchableFields.push('sup.name');
    
    addKeywordIlikeGroup(
      conditions,
      params,
      paramIndexRef.value,
      normalizedFilters.keyword,
      searchableFields
    );
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildBatchRegistryInventoryScopeFilter,
  buildBatchRegistryFilter,
};
