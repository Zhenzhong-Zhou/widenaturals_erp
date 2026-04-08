/**
 * @file build-inventory-allocation-filter.js
 * @description SQL WHERE clause builder for inventory allocation queries.
 *
 * This builder is unique — it returns TWO separate WHERE clauses with independent
 * param arrays to support the two-level CTE in getPaginatedInventoryAllocations:
 *  - rawAllocWhereClause / rawAllocParams — applied to the inner raw_alloc CTE (ia.*)
 *  - outerWhereClause / outerParams       — applied to the outer aggregated query (o.*, aa.*)
 *
 * Two separate paramIndexRef objects are used because the two clause sets are
 * concatenated in the caller as [...rawAllocParams, ...outerParams], so each
 * must maintain its own independent $1..$N sequence.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 *
 * Exports:
 *  - buildInventoryAllocationFilter
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds two parameterised SQL WHERE clauses for inventory allocation queries.
 *
 * Returns rawAllocWhereClause for inner CTE filtering and outerWhereClause
 * for outer aggregated query filtering. Each has its own independent params array.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.statusIds]                  - Filter by allocation status UUIDs (inner).
 * @param {string[]} [filters.warehouseIds]               - Filter by warehouse UUIDs (inner).
 * @param {string[]} [filters.batchIds]                   - Filter by batch UUIDs (inner).
 * @param {string}   [filters.allocationCreatedBy]        - Filter by allocation creator UUID (inner).
 * @param {string}   [filters.allocatedAfter]             - Lower bound for allocated_at (inner, UTC).
 * @param {string}   [filters.allocatedBefore]            - Upper bound for allocated_at (inner, UTC).
 * @param {string}   [filters.aggregatedAllocatedAfter]   - Lower bound for aa.allocated_at (outer, UTC).
 * @param {string}   [filters.aggregatedAllocatedBefore]  - Upper bound for aa.allocated_at (outer, UTC).
 * @param {string}   [filters.aggregatedCreatedAfter]     - Lower bound for aa.allocated_created_at (outer, UTC).
 * @param {string}   [filters.aggregatedCreatedBefore]    - Upper bound for aa.allocated_created_at (outer, UTC).
 * @param {string}   [filters.orderNumber]                - ILIKE filter on order number (outer).
 * @param {string}   [filters.orderStatusId]              - Filter by order status UUID (outer).
 * @param {string}   [filters.orderTypeId]                - Filter by order type UUID (outer).
 * @param {string}   [filters.orderCreatedBy]             - Filter by order creator UUID (outer).
 * @param {string}   [filters.paymentStatusId]            - Filter by payment status UUID (outer).
 * @param {string}   [filters.keyword]                    - ILIKE search across order number and customer name (outer).
 *
 * @returns {{
 *   rawAllocWhereClause: string,
 *   rawAllocParams:      Array,
 *   outerWhereClause:    string,
 *   outerParams:         Array
 * }}
 */
const buildInventoryAllocationFilter = (filters = {}) => {
  // Normalize all date ranges into UTC ISO boundaries.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(
      normalizeDateRangeFilters(
        filters,
        'allocatedAfter', 'allocatedBefore'
      ),
      'aggregatedAllocatedAfter', 'aggregatedAllocatedBefore'
    ),
    'aggregatedCreatedAfter', 'aggregatedCreatedBefore'
  );
  
  const rawAllocConditions = ['1=1'];
  const outerConditions    = ['1=1'];
  const rawAllocParams     = [];
  const outerParams        = [];
  
  // Two independent index refs — raw and outer params are concatenated in the
  // caller as [...rawAllocParams, ...outerParams], so each starts at $1.
  const rawIndexRef   = { value: 1 };
  const outerIndexRef = { value: 1 };
  
  // ─── Inner CTE: Allocation-Level Filters (ia.*) ──────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    rawAllocConditions.push(`ia.status_id = ANY($${rawIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.statusIds);
    rawIndexRef.value++;
  }
  
  if (normalizedFilters.warehouseIds?.length) {
    rawAllocConditions.push(`ia.warehouse_id = ANY($${rawIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.warehouseIds);
    rawIndexRef.value++;
  }
  
  if (normalizedFilters.batchIds?.length) {
    rawAllocConditions.push(`ia.batch_id = ANY($${rawIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.batchIds);
    rawIndexRef.value++;
  }
  
  if (normalizedFilters.allocationCreatedBy) {
    rawAllocConditions.push(`ia.created_by = $${rawIndexRef.value}`);
    rawAllocParams.push(normalizedFilters.allocationCreatedBy);
    rawIndexRef.value++;
  }
  
  applyDateRangeConditions({
    conditions:    rawAllocConditions,
    params:        rawAllocParams,
    column:        'ia.allocated_at',
    after:         normalizedFilters.allocatedAfter,
    before:        normalizedFilters.allocatedBefore,
    paramIndexRef: rawIndexRef,
  });
  
  // ─── Outer Query: Aggregated Order-Level Filters (o.*, aa.*) ─────────────────
  
  applyDateRangeConditions({
    conditions:    outerConditions,
    params:        outerParams,
    column:        'aa.allocated_at',
    after:         normalizedFilters.aggregatedAllocatedAfter,
    before:        normalizedFilters.aggregatedAllocatedBefore,
    paramIndexRef: outerIndexRef,
  });
  
  applyDateRangeConditions({
    conditions:    outerConditions,
    params:        outerParams,
    column:        'aa.allocated_created_at',
    after:         normalizedFilters.aggregatedCreatedAfter,
    before:        normalizedFilters.aggregatedCreatedBefore,
    paramIndexRef: outerIndexRef,
  });
  
  if (normalizedFilters.orderNumber) {
    outerConditions.push(`o.order_number ILIKE $${outerIndexRef.value}`);
    outerParams.push(`%${normalizedFilters.orderNumber}%`);
    outerIndexRef.value++;
  }
  
  if (normalizedFilters.orderStatusId) {
    outerConditions.push(`o.order_status_id = $${outerIndexRef.value}`);
    outerParams.push(normalizedFilters.orderStatusId);
    outerIndexRef.value++;
  }
  
  if (normalizedFilters.orderTypeId) {
    outerConditions.push(`o.order_type_id = $${outerIndexRef.value}`);
    outerParams.push(normalizedFilters.orderTypeId);
    outerIndexRef.value++;
  }
  
  if (normalizedFilters.orderCreatedBy) {
    outerConditions.push(`o.created_by = $${outerIndexRef.value}`);
    outerParams.push(normalizedFilters.orderCreatedBy);
    outerIndexRef.value++;
  }
  
  if (normalizedFilters.paymentStatusId) {
    outerConditions.push(`so.payment_status_id = $${outerIndexRef.value}`);
    outerParams.push(normalizedFilters.paymentStatusId);
    outerIndexRef.value++;
  }
  
  // ─── Keyword (must remain last) ──────────────────────────────────────────────
  
  // Same $N referenced twice — single param covers both fields.
  if (normalizedFilters.keyword) {
    outerConditions.push(`(
      o.order_number ILIKE $${outerIndexRef.value} OR
      COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $${outerIndexRef.value}
    )`);
    outerParams.push(`%${normalizedFilters.keyword}%`);
    outerIndexRef.value++;
  }
  
  return {
    rawAllocWhereClause: rawAllocConditions.join(' AND '),
    rawAllocParams,
    outerWhereClause:    outerConditions.join(' AND '),
    outerParams,
  };
};

module.exports = {
  buildInventoryAllocationFilter,
};
