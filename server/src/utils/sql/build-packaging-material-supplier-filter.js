/**
 * @fileoverview build-packaging-material-supplier-filter.js
 *
 * Helper for constructing SQL WHERE clauses and parameter arrays
 * for repository-layer packaging material supplier lookup queries.
 *
 * Applies row-level filtering on:
 * - packaging_material_suppliers (alias: pms)
 * - suppliers (alias: s)
 *
 * Visibility rules are enforced through flags passed by the service / ACL layer.
 * By default, archived suppliers are excluded unless explicitly requested.
 *
 * This helper ONLY builds SQL conditions and parameters.
 * Permission enforcement must be handled by the service layer.
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addIlikeFilter } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list
 * for packaging material supplier queries.
 *
 * NOTE:
 * - WHERE clause always starts with `1=1` for easier condition appending.
 * - All filters are optional.
 *
 * @param {Object} [filters={}]
 *
 * ------------------------------------------------------------------
 * Visibility Rules (service-controlled)
 * ------------------------------------------------------------------
 *
 * @param {boolean} [filters.includeArchived=false]
 *   When TRUE, archived suppliers (`s.is_archived = TRUE`) are included.
 *   Otherwise, archived suppliers are hidden by default.
 *
 * @param {boolean} [filters.enforceActiveOnly=false]
 *   When TRUE, results are restricted to suppliers with ACTIVE status.
 *
 * @param {string} [filters.activeStatusId]
 *   UUID of the ACTIVE status used when `enforceActiveOnly` is enabled.
 *   If NOT provided, the active filter will NOT be applied.
 *   This value must be resolved by the service layer.
 *
 * ------------------------------------------------------------------
 * Relationship Filters (pms)
 * ------------------------------------------------------------------
 *
 * @param {string[]} [filters.ids]
 *   Filter by relationship UUIDs (UUID[]).
 *
 * @param {string} [filters.packagingMaterialId]
 *   Filter by packaging material ID (UUID).
 *
 * @param {string} [filters.supplierId]
 *   Filter by supplier ID (UUID).
 *
 * @param {boolean} [filters.isPreferred]
 *   Filter by preferred supplier flag.
 *
 * ------------------------------------------------------------------
 * Pricing Filters (pms)
 * ------------------------------------------------------------------
 *
 * @param {number} [filters.minCost]
 *   Minimum contract unit cost.
 *
 * @param {number} [filters.maxCost]
 *   Maximum contract unit cost.
 *
 * @param {string} [filters.currency]
 *   Currency code for contract pricing.
 *
 * ------------------------------------------------------------------
 * Text Filters
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.note]
 *   Case-insensitive partial match (ILIKE) on `pms.note`.
 *
 * ------------------------------------------------------------------
 * Keyword Search
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.keyword]
 *   Case-insensitive fuzzy search using ILIKE with `%keyword%`
 *   across:
 *   - supplier name (`s.name`)
 *   - supplier code (`s.code`)
 *   - relationship notes (`pms.note`)
 *
 * ------------------------------------------------------------------
 * Audit Filters
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.createdBy]
 *   UUID of the user who created the relationship.
 *
 * @param {string} [filters.updatedBy]
 *   UUID of the user who last updated the relationship.
 *
 * @param {string} [filters.createdAfter]
 *   ISO timestamp filter (`pms.created_at >=`).
 *
 * @param {string} [filters.createdBefore]
 *   ISO timestamp filter (`pms.created_at <=`).
 *
 * @param {string} [filters.updatedAfter]
 *   ISO timestamp filter (`pms.updated_at >=`).
 *
 * @param {string} [filters.updatedBefore]
 *   ISO timestamp filter (`pms.updated_at <=`).
 *
 * ------------------------------------------------------------------
 * Return
 * ------------------------------------------------------------------
 *
 * {
 *   whereClause: '1=1 AND ...',
 *   params: any[]
 * }
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildPackagingMaterialSupplierFilter = (filters = {}) => {
  try {
    //------------------------------------------------------------
    // Normalize date filters
    //------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );
    
    filters = normalizeDateRangeFilters(
      filters,
      'updatedAfter',
      'updatedBefore'
    );
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    //------------------------------------------------------------
    // Visibility rules (service / ACL controlled)
    //------------------------------------------------------------
    
    const includeArchived = filters.includeArchived === true;
    const enforceActiveOnly = filters.enforceActiveOnly === true;
    
    // Hide archived suppliers by default
    if (!includeArchived) {
      conditions.push(`s.is_archived = FALSE`);
    }
    
    // Enforce ACTIVE supplier status if requested
    if (enforceActiveOnly && filters.activeStatusId) {
      conditions.push(`s.status_id = $${paramIndexRef.value}`);
      params.push(filters.activeStatusId);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Relationship filters (pms)
    //------------------------------------------------------------
    
    if (filters.ids?.length) {
      conditions.push(`pms.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.ids);
      paramIndexRef.value++;
    }
    
    if (filters.packagingMaterialId) {
      conditions.push(`pms.packaging_material_id = $${paramIndexRef.value}`);
      params.push(filters.packagingMaterialId);
      paramIndexRef.value++;
    }
    
    if (filters.supplierId) {
      conditions.push(`pms.supplier_id = $${paramIndexRef.value}`);
      params.push(filters.supplierId);
      paramIndexRef.value++;
    }
    
    if (filters.isPreferred !== undefined) {
      conditions.push(`pms.is_preferred = $${paramIndexRef.value}`);
      params.push(filters.isPreferred);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Pricing filters (pms)
    //------------------------------------------------------------
    
    if (filters.minCost !== undefined) {
      conditions.push(`pms.contract_unit_cost >= $${paramIndexRef.value}`);
      params.push(filters.minCost);
      paramIndexRef.value++;
    }
    
    if (filters.maxCost !== undefined) {
      conditions.push(`pms.contract_unit_cost <= $${paramIndexRef.value}`);
      params.push(filters.maxCost);
      paramIndexRef.value++;
    }
    
    if (filters.currency) {
      conditions.push(`pms.currency = $${paramIndexRef.value}`);
      params.push(filters.currency);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Text filters
    //------------------------------------------------------------
    
    paramIndexRef.value = addIlikeFilter(
      conditions,
      params,
      paramIndexRef.value,
      filters.note,
      'pms.note'
    );
    
    //------------------------------------------------------------
    // Keyword fuzzy search
    //------------------------------------------------------------
    
    if (filters.keyword) {
      const keywordConditions = [
        `s.name ILIKE $${paramIndexRef.value}`,
        `s.code ILIKE $${paramIndexRef.value}`,
        `pms.note ILIKE $${paramIndexRef.value}`,
      ];
      
      conditions.push(`(${keywordConditions.join(' OR ')})`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Audit filters
    //------------------------------------------------------------
    
    if (filters.createdBy) {
      conditions.push(`pms.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`pms.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    //------------------------------------------------------------
    // Date range filters
    //------------------------------------------------------------
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'pms.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'pms.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to build packaging material supplier filter',
      {
        context:
          'packaging-material-supplier-repository/buildPackagingMaterialSupplierFilter',
        filters,
      }
    );
    
    throw AppError.databaseError(
      'Failed to prepare packaging material supplier filter',
      {
        details: err.message,
      }
    );
  }
};

module.exports = {
  buildPackagingMaterialSupplierFilter,
};
