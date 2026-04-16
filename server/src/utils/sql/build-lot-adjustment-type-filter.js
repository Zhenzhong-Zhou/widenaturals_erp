/**
 * @file build-lot-adjustment-type-filter.js
 * @description SQL WHERE clause builder for lot adjustment type queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Always filters to active records (lat.is_active = true).
 *
 * Exports:
 *  - buildLotAdjustmentWhereClause
 */

'use strict';

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a SQL WHERE clause for lot adjustment type queries.
 *
 * Active-only filter is always applied — inactive types are not surfaced
 * in any lookup or selection interface.
 *
 * excludeInternal removes stock management types that are only valid for
 * internal system operations and should not appear in user-facing dropdowns.
 *
 * Note: this builder produces no bound params for the current filter set —
 * all conditions use hardcoded sentinel values, not user input.
 * The params array is returned for interface consistency with other builders.
 *
 * @param {Object}  [filters={}]
 * @param {boolean} [filters.restrictToQtyAdjustment] - If true, restricts to iat.category = 'adjustment'.
 * @param {boolean} [filters.excludeInternal]         - If true, excludes 'manual_stock_insert' and 'manual_stock_update'.
 *
 * @returns {{ whereClause: string, params: Array }} WHERE clause and empty params array.
 */
const buildLotAdjustmentWhereClause = (filters = {}) => {
  // Active-only is always enforced — no param needed, hardcoded sentinel.
  const conditions = [`lat.is_active = true`];
  const params = [];

  if (filters.restrictToQtyAdjustment) {
    // Restricts to inventory action types in the adjustment category only.
    conditions.push(`iat.category = 'adjustment'`);
  }

  if (filters.excludeInternal) {
    // Excludes types reserved for internal stock management operations
    // that should not appear in user-facing adjustment interfaces.
    conditions.push(
      `lat.name NOT IN ('manual_stock_insert', 'manual_stock_update')`
    );
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildLotAdjustmentWhereClause,
};
