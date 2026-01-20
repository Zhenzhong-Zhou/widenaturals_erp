/**
 * Packaging Material Batch Filter Builder
 *
 * Provides SQL WHERE clause construction for
 * packaging material batch list queries at the repository layer.
 *
 * Scope:
 * - Applies only to `packaging_material_batches` operational queries
 * - Assumes required joins (pms, pm, s, bs)
 *
 * This builder:
 * - Produces SQL-safe, parameterized conditions
 * - Is snapshot-first (does NOT depend on mutable master identity)
 * - Remains repository-only and side effect free
 *
 * Business rules, permissions, pagination, and sorting
 * are enforced upstream.
 */

const { addKeywordIlikeGroup } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list for Packaging Material Batch queries.
 *
 * Responsibilities:
 * - Construct row-level filters for PACKAGING MATERIAL batch LIST queries
 * - Express permission-adjusted search intent as SQL-safe conditions
 * - Remain repository-only and side effect free
 *
 * Does NOT:
 * - Interpret ACL or permissions
 * - Apply pagination or sorting
 * - Join inventory, QA, or costing logic
 *
 * @param {Object} [filters={}]
 *
 * ------------------------------------------------------------------
 * Enforcement Flags (business-injected, NOT user-controlled)
 * ------------------------------------------------------------------
 *
 * @param {boolean} [filters.forceEmptyResult]
 *   When TRUE, forces the query to return zero rows (`1=0`).
 *
 * ------------------------------------------------------------------
 * Core Packaging Material Batch Filters
 * ------------------------------------------------------------------
 *
 * @param {string[]} [filters.statusIds]
 * @param {string[]} [filters.packagingMaterialIds]
 * @param {string[]} [filters.supplierIds]
 * @param {boolean}  [filters.preferredSupplierOnly]
 *
 * ------------------------------------------------------------------
 * Lot & Date Filters
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.lotNumber]
 * @param {string} [filters.expiryAfter]
 * @param {string} [filters.expiryBefore]
 * @param {string} [filters.receivedAfter]
 * @param {string} [filters.receivedBefore]
 *
 * ------------------------------------------------------------------
 * Keyword Search (permission-aware)
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.keyword]
 *
 * @param {Object} [filters.keywordCapabilities]
 *   Supported capabilities:
 *     - canSearchInternalName   → pmb.material_snapshot_name
 *     - canSearchSupplierLabel  → pmb.received_label_name
 *     - canSearchMaterialCode  → pm.code
 *     - canSearchSupplier      → s.name
 *
 *   Lot number search is always allowed.
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildPackagingMaterialBatchFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;
    
    // -------------------------------------------------------------
    // Hard fail-closed
    // -------------------------------------------------------------
    if (filters.forceEmptyResult === true) {
      return {
        whereClause: '1=1 AND 1=0',
        params: [],
      };
    }
    
    // ------------------------------
    // Status
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`pmb.status_id = ANY($${idx}::uuid[])`);
      params.push(filters.statusIds);
      idx++;
    }
    
    // ------------------------------
    // Packaging material / Supplier
    // ------------------------------
    if (filters.packagingMaterialIds?.length) {
      conditions.push(`pm.id = ANY($${idx}::uuid[])`);
      params.push(filters.packagingMaterialIds);
      idx++;
    }
    
    if (filters.supplierIds?.length) {
      conditions.push(`s.id = ANY($${idx}::uuid[])`);
      params.push(filters.supplierIds);
      idx++;
    }
    
    if (filters.preferredSupplierOnly === true) {
      conditions.push(`pms.is_preferred = true`);
    }
    
    // ------------------------------
    // Lot number (ILIKE)
    // ------------------------------
    if (filters.lotNumber) {
      conditions.push(`pmb.lot_number ILIKE $${idx}`);
      params.push(`%${filters.lotNumber}%`);
      idx++;
    }
    
    // ------------------------------
    // Expiry date filters
    // ------------------------------
    if (filters.expiryAfter) {
      conditions.push(`pmb.expiry_date >= $${idx}`);
      params.push(filters.expiryAfter);
      idx++;
    }
    
    if (filters.expiryBefore) {
      conditions.push(`pmb.expiry_date <= $${idx}`);
      params.push(filters.expiryBefore);
      idx++;
    }
    
    // ------------------------------
    // Received date filters
    // ------------------------------
    if (filters.receivedAfter) {
      conditions.push(`pmb.received_at >= $${idx}`);
      params.push(filters.receivedAfter);
      idx++;
    }
    
    if (filters.receivedBefore) {
      conditions.push(`pmb.received_at <= $${idx}`);
      params.push(filters.receivedBefore);
      idx++;
    }
    
    // ------------------------------
    // Keyword fuzzy search (permission-aware)
    // ------------------------------
    if (filters.keyword && filters.keywordCapabilities) {
      const {
        canSearchInternalName,
        canSearchSupplierLabel,
        canSearchMaterialCode,
        canSearchSupplier,
      } = filters.keywordCapabilities;
      
      const searchableFields = [
        'pmb.lot_number', // always allowed
      ];
      
      if (canSearchInternalName)
        searchableFields.push('pmb.material_snapshot_name');
      
      if (canSearchSupplierLabel)
        searchableFields.push('pmb.received_label_name');
      
      if (canSearchMaterialCode)
        searchableFields.push('pm.code');
      
      if (canSearchSupplier)
        searchableFields.push('s.name');
      
      /**
       * addKeywordIlikeGroup:
       * - Appends `(field ILIKE $n OR ...)`
       * - Pushes keyword param internally
       * - Manages placeholder index internally
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
    logSystemException(err, 'Failed to build packaging material batch filter', {
      context:
        'packaging-material-batch-repository/buildPackagingMaterialBatchFilter',
      filters,
    });
    
    throw AppError.databaseError(
      'Failed to prepare packaging material batch filter',
      {
        details: err.message,
      }
    );
  }
};

module.exports = {
  buildPackagingMaterialBatchFilter,
};
