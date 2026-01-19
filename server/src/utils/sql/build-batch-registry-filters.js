/**
 * @fileoverview
 * Utility for dynamically building SQL WHERE clause and parameter bindings
 * for `batch_registry`–related queries.
 *
 * Features:
 * - Dynamically filters by batch type (e.g., 'product', 'packaging_material')
 * - Optionally excludes batches already present in warehouse or location inventory
 * - Uses safe positional SQL bindings (e.g., $1, $2)
 * - Designed for reuse across dropdowns, insert checks, and batch selection UIs
 *
 * Extendable to support additional filters like:
 * - Expiry date ranges
 * - Lot number (partial or exact)
 * - Manufacturer or SKU
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');
const { addKeywordIlikeGroup } = require('./sql-helpers');

/**
 * Builds an SQL WHERE clause and parameter list for querying `batch_registry` records.
 *
 * Supports:
 * - Filtering by batch type (e.g., 'product' or 'packaging_material')
 * - Excluding already-used batches based on their presence in:
 *   - Any warehouse (`warehouse_inventory`)
 *   - Any location (`location_inventory`)
 *   - Both (combined check)
 * - Optional scoping of exclusions to a specific warehouse or location.
 *
 * @param {Object} filters - Filtering options.
 * @param {'product'|'packaging_material'=} [filters.batchType] - Optional batch type to include in the result.
 * @param {'warehouse_only'|'location_only'|'any_inventory'=} [filters.excludeFrom] - Optional exclusion rule based on inventory presence.
 * @param {string=} [filters.warehouseId] - Optional warehouse ID to scope the exclusion for `warehouse_only`.
 * @param {string=} [filters.locationId] - Optional location ID to scope the exclusion for `location_only`.
 *
 * @returns {{ whereClause: string, params: any[] }} - An object containing the SQL WHERE clause string and the parameter bindings array.
 */
const buildBatchRegistryInventoryScopeFilter = (filters = {}) => {
  const whereClauses = ['1=1'];
  const params = [];

  if (filters.batchType) {
    params.push(filters.batchType);
    whereClauses.push(`br.batch_type = $${params.length}`);
  }

  if (filters.warehouseId) {
    whereClauses.push(`
      NOT EXISTS (
        SELECT 1 FROM warehouse_inventory wi
        WHERE wi.batch_id = br.id AND wi.warehouse_id = $${params.length + 1}
      )
    `);
    params.push(filters.warehouseId);
  }

  if (filters.locationId) {
    whereClauses.push(`
      NOT EXISTS (
        SELECT 1 FROM location_inventory li
        WHERE li.batch_id = br.id AND li.location_id = $${params.length + 1}
      )
    `);
    params.push(filters.locationId);
  }

  return {
    whereClause: whereClauses.join(' AND '),
    params,
  };
};

/**
 * Build SQL WHERE clause and parameter list for Batch Registry queries.
 *
 * Responsibilities:
 * - Construct row-level filters for batch registry LIST queries
 * - Support polymorphic filtering across product and packaging batches
 * - Express permission-adjusted search intent as SQL-safe conditions
 * - Remain repository-only and side effect free
 *
 * Does NOT:
 * - Interpret permissions or evaluate ACL
 * - Transform, group, or normalize batch data
 * - Apply pagination, sorting, or inventory placement logic
 *
 * @param {Object} [filters={}]
 *
 * ------------------------------------------------------------------
 * Enforcement Flags (business-injected, NOT user-controlled)
 * ------------------------------------------------------------------
 *
 * @param {boolean} [filters.forceEmptyResult]
 *   When TRUE, forces the query to return zero rows (`1=0`).
 *   Used to fail closed when the requester has no batch visibility.
 *   This flag MUST only be injected by the business layer.
 *
 * ------------------------------------------------------------------
 * Core Batch Registry Filters
 * ------------------------------------------------------------------
 *
 * @param {'product'|'packaging_material'} [filters.batchType]
 *   Restrict results to a single batch category.
 *
 * @param {string[]} [filters.statusIds]
 *   Filter by batch status UUID(s).
 *   Applied polymorphically to:
 *     - product_batches.status_id
 *     - packaging_material_batches.status_id
 *
 * ------------------------------------------------------------------
 * Product Batch Filters (applied when joined)
 * ------------------------------------------------------------------
 *
 * @param {string[]} [filters.skuIds]
 *   Filter by SKU UUID(s).
 *
 * @param {string[]} [filters.productIds]
 *   Filter by Product UUID(s).
 *
 * @param {string[]} [filters.manufacturerIds]
 *   Filter by Manufacturer UUID(s).
 *
 * ------------------------------------------------------------------
 * Packaging Batch Filters (applied when joined)
 * ------------------------------------------------------------------
 *
 * @param {string[]} [filters.packagingMaterialIds]
 *   Filter by Packaging Material UUID(s).
 *
 * @param {string[]} [filters.supplierIds]
 *   Filter by Supplier UUID(s).
 *
 * ------------------------------------------------------------------
 * Lot & Date Filters (polymorphic)
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.lotNumber]
 *   ILIKE filter applied to both product and packaging lot numbers.
 *
 * @param {string} [filters.expiryAfter]
 * @param {string} [filters.expiryBefore]
 *
 * @param {string} [filters.registeredAfter]
 * @param {string} [filters.registeredBefore]
 *
 * ------------------------------------------------------------------
 * Keyword Search (permission-aware, polymorphic)
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.keyword]
 *   Free-text search applied across permitted fields only.
 *
 * @param {Object} [filters.keywordCapabilities]
 *   Capability flags injected by the business layer to control
 *   which joined fields are eligible for keyword search.
 *
 *   Supported capabilities:
 *     - canSearchProduct              → products.name
 *     - canSearchSku                  → skus.sku
 *     - canSearchManufacturer         → manufacturers.name
 *     - canSearchPackagingMaterial    → packaging_materials.name
 *     - canSearchSupplier             → suppliers.name
 *
 *   Lot number search is always allowed.
 *
 *   If no searchable fields are permitted, the keyword filter
 *   FAILS CLOSED and produces an empty result set.
 *
 *   Visibility of joined fields is enforced upstream by ACL.
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildBatchRegistryFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;
    
    // -------------------------------------------------------------
    // Hard fail-closed: no visibility → empty result set
    // -------------------------------------------------------------
    // Injected by business layer ONLY.
    // Guarantees zero rows without invalid enum or SQL errors.
    if (filters.forceEmptyResult === true) {
      return {
        whereClause: '1=1 AND 1=0',
        params: [],
      };
    }
    
    // ------------------------------
    // Core batch registry filters
    // ------------------------------
    if (filters.batchType) {
      conditions.push(`br.batch_type = $${idx}`);
      params.push(filters.batchType);
      idx++;
    }
    
    // ------------------------------
    // Status filters (polymorphic)
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`
        (
          pb.status_id = ANY($${idx}::uuid[])
          OR pmb.status_id = ANY($${idx}::uuid[])
        )
      `);
      params.push(filters.statusIds);
      idx++;
    }
    
    // ------------------------------
    // Product batch filters
    // ------------------------------
    if (filters.skuIds?.length) {
      conditions.push(`s.id = ANY($${idx}::uuid[])`);
      params.push(filters.skuIds);
      idx++;
    }
    
    if (filters.productIds?.length) {
      conditions.push(`p.id = ANY($${idx}::uuid[])`);
      params.push(filters.productIds);
      idx++;
    }
    
    if (filters.manufacturerIds?.length) {
      conditions.push(`m.id = ANY($${idx}::uuid[])`);
      params.push(filters.manufacturerIds);
      idx++;
    }
    
    // ------------------------------
    // Packaging batch filters
    // ------------------------------
    if (filters.packagingMaterialIds?.length) {
      conditions.push(`pm.id = ANY($${idx}::uuid[])`);
      params.push(filters.packagingMaterialIds);
      idx++;
    }
    
    if (filters.supplierIds?.length) {
      conditions.push(`sup.id = ANY($${idx}::uuid[])`);
      params.push(filters.supplierIds);
      idx++;
    }
    
    // ------------------------------
    // Lot number (ILIKE, polymorphic)
    // ------------------------------
    if (filters.lotNumber) {
      conditions.push(`
        (
          pb.lot_number ILIKE $${idx}
          OR pmb.lot_number ILIKE $${idx}
        )
      `);
      params.push(`%${filters.lotNumber}%`);
      idx++;
    }
    
    // ------------------------------
    // Expiry date filters (polymorphic)
    // ------------------------------
    if (filters.expiryAfter) {
      conditions.push(`
        (
          pb.expiry_date >= $${idx}
          OR pmb.expiry_date >= $${idx}
        )
      `);
      params.push(filters.expiryAfter);
      idx++;
    }
    
    if (filters.expiryBefore) {
      conditions.push(`
        (
          pb.expiry_date <= $${idx}
          OR pmb.expiry_date <= $${idx}
        )
      `);
      params.push(filters.expiryBefore);
      idx++;
    }
    
    // ------------------------------
    // Registry-level date filters
    // ------------------------------
    if (filters.registeredAfter) {
      conditions.push(`br.registered_at >= $${idx}`);
      params.push(filters.registeredAfter);
      idx++;
    }
    
    if (filters.registeredBefore) {
      conditions.push(`br.registered_at <= $${idx}`);
      params.push(filters.registeredBefore);
      idx++;
    }
    
    // ------------------------------
    // Keyword fuzzy search (permission-aware)
    // ------------------------------
    if (filters.keyword && filters.keywordCapabilities) {
      const {
        canSearchProduct,
        canSearchSku,
        canSearchManufacturer,
        canSearchPackagingMaterial,
        canSearchSupplier,
      } = filters.keywordCapabilities;
      
      const searchableFields = [
        'pb.lot_number',
        'pmb.lot_number',
      ];
      
      if (canSearchProduct) searchableFields.push('p.name');
      if (canSearchSku) searchableFields.push('s.sku');
      if (canSearchManufacturer) searchableFields.push('m.name');
      if (canSearchPackagingMaterial) searchableFields.push('pm.name');
      if (canSearchSupplier) searchableFields.push('sup.name');
      
      /**
       * addKeywordIlikeGroup:
       * - Appends a grouped `(field ILIKE $n OR ...)` condition
       * - Pushes the keyword parameter internally
       * - Consumes placeholder indices internally
       *
       * IMPORTANT:
       * - `idx` is intentionally NOT reassigned here
       * - This helper is the sole owner of index advancement
       */
      addKeywordIlikeGroup(
        conditions,
        params,
        idx,
        filters.keyword,
        searchableFields
      );
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build batch registry filter', {
      context: 'batch-registry-repository/buildBatchRegistryFilter',
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare batch registry filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildBatchRegistryInventoryScopeFilter,
  buildBatchRegistryFilter,
};
