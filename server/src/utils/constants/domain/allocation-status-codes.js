/**
 * @file allocation-status-codes.js
 * @description Domain constants for inventory allocation status codes.
 *
 * Mirrors the `code` column on the inventory_allocation_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — allocation lifecycle gating,
 *    transition validation via ALLOWED_ALLOCATION_TRANSITIONS, target code
 *    resolution during confirm/complete flows
 *  - validateAllocationStatusTransition — graph-based transition validation
 *    against ALLOWED_ALLOCATION_TRANSITIONS (single source of truth for
 *    which allocation state moves are legal)
 *  - confirm-outbound-fulfillment service — hardcoded ALLOC_COMPLETED target
 *    when confirming fulfillment and deducting reserved inventory
 *  - allocation validators / ACL guards — eligibility checks against
 *    current allocation state before mutation
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the inventory_allocation_status
 *    seed, update both ALLOCATION_STATUS_CODES and ALLOWED_ALLOCATION_TRANSITIONS
 *    in the same commit. Mismatches surface as cache misses in status
 *    resolution, silent dispatch failures, or transitions failing closed
 *    at the validator.
 */

'use strict';

/**
 * @typedef {typeof ALLOCATION_STATUS_CODES[keyof typeof ALLOCATION_STATUS_CODES]} AllocationStatusCode
 *   String literal union of every value in ALLOCATION_STATUS_CODES.
 */
const ALLOCATION_STATUS_CODES = Object.freeze({
  PENDING:    'ALLOC_PENDING',
  CONFIRMED:  'ALLOC_CONFIRMED',
  PARTIAL:    'ALLOC_PARTIAL',
  COMPLETED:  'ALLOC_COMPLETED',
  FULFILLING: 'ALLOC_FULFILLING',
  FULFILLED:  'ALLOC_FULFILLED',
  CANCELLED:  'ALLOC_CANCELLED',
});

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

/**
 * Allowed forward transitions for inventory allocation status codes, used by
 * validateAllocationStatusTransition as the single source of truth for which
 * state moves are legal.
 *
 * Lifecycle (outbound sales flow):
 *   PENDING    → CONFIRMED (allocation finalized) or PARTIAL (some line items
 *                short, others filled) or CANCELLED
 *   PARTIAL    → CONFIRMED (remaining items allocated) or CANCELLED
 *   CONFIRMED  → FULFILLING (fulfill service kicks off pick-pack) or CANCELLED
 *   FULFILLING → COMPLETED (confirm service flips reserved → fulfilled) or CANCELLED
 *   COMPLETED  → FULFILLED (complete service finalizes the shipment) or CANCELLED
 *   FULFILLED  → terminal (no outbound transitions)
 *   CANCELLED  → terminal (no outbound transitions)
 *
 * Terminal states are encoded as empty arrays; the validator rejects any
 * attempt to transition out of them via a length check, which makes
 * terminal-ness declarative rather than dependent on a separate predicate
 * or on sequence position.
 *
 * Sync requirement:
 *   - If a code is added, removed, or renamed in the inventory_allocation_status
 *     seed, update both ALLOCATION_STATUS_CODES and this map in the same commit.
 *     A code that isn't a key here is treated as unknown by the validator and
 *     fails closed.
 */
const ALLOWED_ALLOCATION_TRANSITIONS = Object.freeze({
  [ALLOCATION_STATUS_CODES.PENDING]:    [ALLOCATION_STATUS_CODES.CONFIRMED, ALLOCATION_STATUS_CODES.PARTIAL, ALLOCATION_STATUS_CODES.CANCELLED],
  [ALLOCATION_STATUS_CODES.PARTIAL]:    [ALLOCATION_STATUS_CODES.CONFIRMED, ALLOCATION_STATUS_CODES.CANCELLED],
  [ALLOCATION_STATUS_CODES.CONFIRMED]:  [ALLOCATION_STATUS_CODES.FULFILLING, ALLOCATION_STATUS_CODES.CANCELLED],
  [ALLOCATION_STATUS_CODES.FULFILLING]: [ALLOCATION_STATUS_CODES.COMPLETED, ALLOCATION_STATUS_CODES.CANCELLED],
  [ALLOCATION_STATUS_CODES.COMPLETED]:  [ALLOCATION_STATUS_CODES.FULFILLED, ALLOCATION_STATUS_CODES.CANCELLED],
  [ALLOCATION_STATUS_CODES.FULFILLED]:  [],  // terminal
  [ALLOCATION_STATUS_CODES.CANCELLED]:  [],  // terminal
});

module.exports = {
  ALLOCATION_STATUS_CODES,
  ALLOWED_ALLOCATION_TRANSITIONS,
};
