/**
 * @file build-inventory-allocation-filter.js
 * @description SQL WHERE clause builder for inventory allocation queries.
 *
 * This builder is unique — it returns TWO separate WHERE clauses with two
 * independent param arrays to support the two-level CTE in
 * getPaginatedInventoryAllocations:
 *  - rawAllocWhereClause / rawAllocParams — applied to the inner raw_alloc CTE (ia.*)
 *  - outerWhereClause    / outerParams    — applied to the outer aggregated query (o.*, aa.*, so.*, c.*)
 *
 * A SINGLE shared paramIndexRef sequences $N across both arrays. Inner params
 * claim $1…$N; outer params continue from $N+1. The repository concatenates
 * the arrays as [...rawAllocParams, ...outerParams] so placeholders line up.
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

/**
 * Builds two parameterised SQL WHERE clauses for inventory allocation queries.
 *
 * @param {InventoryAllocationFilterInput} [filters={}]
 * @returns {InventoryAllocationFilterOutput}
 */
const buildInventoryAllocationFilter = (filters = {}) => {
  // Normalize all three date-range pairs into UTC ISO boundaries up-front.
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
  
  // Single shared ref — inner claims $1…$N, outer continues from $N+1.
  // Repository concatenates [...rawAllocParams, ...outerParams].
  const paramIndexRef = { value: 1 };
  
  // ─── Inner CTE: Allocation-Level Filters (ia.*) ──────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    rawAllocConditions.push(`ia.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.warehouseIds?.length) {
    rawAllocConditions.push(`ia.warehouse_id = ANY($${paramIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.warehouseIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.batchIds?.length) {
    rawAllocConditions.push(`ia.batch_id = ANY($${paramIndexRef.value}::uuid[])`);
    rawAllocParams.push(normalizedFilters.batchIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.allocationCreatedBy) {
    rawAllocConditions.push(`ia.created_by = $${paramIndexRef.value}`);
    rawAllocParams.push(normalizedFilters.allocationCreatedBy);
    paramIndexRef.value++;
  }
  
  applyDateRangeConditions({
    conditions:    rawAllocConditions,
    params:        rawAllocParams,
    column:        'ia.allocated_at',
    after:         normalizedFilters.allocatedAfter,
    before:        normalizedFilters.allocatedBefore,
    paramIndexRef,
  });
  
  // ─── Outer Query: Aggregated Order-Level Filters (o.*, aa.*, so.*) ───────────
  
  applyDateRangeConditions({
    conditions:    outerConditions,
    params:        outerParams,
    column:        'aa.allocated_at',
    after:         normalizedFilters.aggregatedAllocatedAfter,
    before:        normalizedFilters.aggregatedAllocatedBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions:    outerConditions,
    params:        outerParams,
    column:        'aa.allocated_created_at',
    after:         normalizedFilters.aggregatedCreatedAfter,
    before:        normalizedFilters.aggregatedCreatedBefore,
    paramIndexRef,
  });
  
  if (normalizedFilters.orderNumber) {
    outerConditions.push(`o.order_number ILIKE $${paramIndexRef.value}`);
    outerParams.push(`%${normalizedFilters.orderNumber}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.orderStatusId) {
    outerConditions.push(`o.order_status_id = $${paramIndexRef.value}`);
    outerParams.push(normalizedFilters.orderStatusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.orderTypeId) {
    outerConditions.push(`o.order_type_id = $${paramIndexRef.value}`);
    outerParams.push(normalizedFilters.orderTypeId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.orderCreatedBy) {
    outerConditions.push(`o.created_by = $${paramIndexRef.value}`);
    outerParams.push(normalizedFilters.orderCreatedBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.paymentStatusId) {
    outerConditions.push(`so.payment_status_id = $${paramIndexRef.value}`);
    outerParams.push(normalizedFilters.paymentStatusId);
    paramIndexRef.value++;
  }
  
  // ─── Keyword (must remain last — single $N shared across three ILIKEs) ───────
  
  if (normalizedFilters.keyword) {
    outerConditions.push(`(
      o.order_number ILIKE $${paramIndexRef.value}
      OR COALESCE(c.company_name, '') ILIKE $${paramIndexRef.value}
      OR COALESCE(c.firstname || ' ' || c.lastname, '') ILIKE $${paramIndexRef.value}
    )`);
    outerParams.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
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
