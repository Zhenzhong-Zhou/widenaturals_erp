/**
 * @file inventory-activity-log-filter.js
 * @description
 * Parameterised WHERE clause builder for inventory activity log queries.
 *
 * Always scoped to a single warehouse. Supports exact-match filters for
 * inventory record, action type, adjustment type, reference type, and
 * performer, plus date range filtering on performed_at.
 *
 * Exports:
 *  - buildInventoryActivityLogFilter
 */

'use strict';

const {
  applyDateRangeConditions,
} = require('./date-range-utils');

/**
 * Builds a parameterised SQL WHERE clause for inventory activity log queries.
 *
 * Always scoped to a single warehouse via warehouseId (required).
 *
 * @param {object}  [filters={}]
 * @param {string}  filters.warehouseId         - Warehouse UUID (required scope).
 * @param {string}  [filters.inventoryId]       - Filter by specific inventory record.
 * @param {string}  [filters.actionTypeId]      - Filter by action type UUID.
 * @param {string}  [filters.adjustmentTypeId]  - Filter by adjustment type UUID.
 * @param {string}  [filters.referenceType]     - Filter by reference type string.
 * @param {string}  [filters.performedBy]       - Filter by user UUID.
 * @param {string}  [filters.performedAtAfter]  - Lower bound (inclusive, UTC).
 * @param {string}  [filters.performedAtBefore] - Upper bound (inclusive, UTC).
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildInventoryActivityLogFilter = (filters = {}) => {
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── Warehouse scope (always applied) ────────────────────────────────────
  
  conditions.push(`wi.warehouse_id = $${paramIndexRef.value++}`);
  params.push(filters.warehouseId);
  
  // ─── Exact-match filters ─────────────────────────────────────────────────
  
  if (filters.inventoryId) {
    conditions.push(`ial.warehouse_inventory_id = $${paramIndexRef.value++}`);
    params.push(filters.inventoryId);
  }
  
  if (filters.actionTypeId) {
    conditions.push(`ial.inventory_action_type_id = $${paramIndexRef.value++}`);
    params.push(filters.actionTypeId);
  }
  
  if (filters.adjustmentTypeId) {
    conditions.push(`ial.adjustment_type_id = $${paramIndexRef.value++}`);
    params.push(filters.adjustmentTypeId);
  }
  
  if (filters.referenceType) {
    conditions.push(`ial.reference_type = $${paramIndexRef.value++}`);
    params.push(filters.referenceType);
  }
  
  if (filters.performedBy) {
    conditions.push(`ial.performed_by = $${paramIndexRef.value++}`);
    params.push(filters.performedBy);
  }
  
  // ─── Date range (raw timestamps, no day normalization) ───────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        'ial.performed_at',
    after:         filters.performedAtAfter,
    before:        filters.performedAtBefore,
    paramIndexRef,
  });
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildInventoryActivityLogFilter,
};
