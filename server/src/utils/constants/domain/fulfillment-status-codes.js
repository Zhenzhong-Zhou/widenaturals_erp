/**
 * @file fulfillment-status-codes.js
 * @description Domain constants for fulfillment status codes.
 *
 * Mirrors the `code` column on the fulfillment_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — terminal-state detection via
 *    TERMINAL_FULFILLMENT_STATUS_CODES, transition validation via
 *    ALLOWED_FULFILLMENT_TRANSITIONS, and target code resolution
 *  - validateFulfillmentStatusTransition — graph-based transition validation
 *    against ALLOWED_FULFILLMENT_TRANSITIONS (single source of truth for
 *    which fulfillment state moves are legal)
 *  - resolveOrderTargetCodeAfterFulfillment — checks if every fulfillment
 *    on an order is terminal to decide SHIPPED vs FULFILLED
 *  - resolveOrderTargetCodeAfterConfirmation — checks the post-confirm
 *    threshold (CONFIRMED_TERMINAL_FULFILLMENT_STATUS_CODES) to decide
 *    FULFILLED vs PARTIALLY_FULFILLED
 *  - resolveOrderTargetCodeAfterDelivery — checks the post-delivery
 *    threshold (DELIVERED_TERMINAL_FULFILLMENT_STATUS_CODES) to decide
 *    DELIVERED vs PARTIALLY_DELIVERED
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the fulfillment_status seed,
 *    update FULFILLMENT_STATUS_CODES, ALLOWED_FULFILLMENT_TRANSITIONS, and
 *    the relevant classification sets (TERMINAL_FULFILLMENT_STATUS_CODES,
 *    CONFIRMED_TERMINAL_FULFILLMENT_STATUS_CODES,
 *    DELIVERED_TERMINAL_FULFILLMENT_STATUS_CODES) in the same commit.
 *    Mismatches surface as cache misses in status resolution, silent
 *    dispatch failures, or transitions failing closed at the validator.
 */

'use strict';

/**
 * @typedef {typeof FULFILLMENT_STATUS_CODES[keyof typeof FULFILLMENT_STATUS_CODES]} FulfillmentStatusCode
 *   String literal union of every value in FULFILLMENT_STATUS_CODES.
 */
const FULFILLMENT_STATUS_CODES = Object.freeze({
  PENDING:   'FULFILLMENT_PENDING',
  PICKING:   'FULFILLMENT_PICKING',
  PACKED:    'FULFILLMENT_PACKED',
  COMPLETED: 'FULFILLMENT_COMPLETED',
  SHIPPED:   'FULFILLMENT_SHIPPED',
  DELIVERED: 'FULFILLMENT_DELIVERED',
  CANCELLED: 'FULFILLMENT_CANCELLED',
});

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

/**
 * Truly terminal fulfillment statuses — no further transitions allowed.
 * Distinct from `TERMINAL_FULFILLMENT_STATUS_CODES` (which includes
 * SHIPPED because SHIPPED is "no shipping work left" even though it
 * may still transition forward to DELIVERED on carrier-tracked routes).
 */
const FULFILLMENT_FINAL_STATUSES = [
  FULFILLMENT_STATUS_CODES.COMPLETED,
  FULFILLMENT_STATUS_CODES.DELIVERED,
  FULFILLMENT_STATUS_CODES.CANCELLED,
];

/**
 * Fulfillment status codes that count as "confirmed or beyond" — i.e. the
 * fulfillment has been packed and is at or past the confirm boundary.
 * Used by resolveOrderTargetCodeAfterConfirmation to determine whether all
 * fulfillments on an order have crossed the confirm threshold.
 */
const CONFIRMED_TERMINAL_FULFILLMENT_STATUS_CODES = [
  FULFILLMENT_STATUS_CODES.PACKED,
  FULFILLMENT_STATUS_CODES.COMPLETED,
  FULFILLMENT_STATUS_CODES.SHIPPED,
  FULFILLMENT_STATUS_CODES.DELIVERED,
  FULFILLMENT_STATUS_CODES.CANCELLED,
];

/**
 * Fulfillment statuses considered "done from the order's perspective" —
 * used when deciding if an order should advance to SHIPPED after one of
 * its fulfillments transitions. Broader than FULFILLMENT_FINAL_STATUSES
 * because SHIPPED counts here (the order's shipping work for that
 * fulfillment is finished; carrier-tracked DELIVERED is downstream).
 */
const TERMINAL_FULFILLMENT_STATUS_CODES = [
  FULFILLMENT_STATUS_CODES.SHIPPED,
  FULFILLMENT_STATUS_CODES.COMPLETED,
  FULFILLMENT_STATUS_CODES.DELIVERED,
  FULFILLMENT_STATUS_CODES.CANCELLED,
];

/**
 * Allowed forward transitions for fulfillment status codes, used by
 * validateFulfillmentStatusTransition as the single source of truth for
 * which state moves are legal.
 *
 * Lifecycle (outbound sales flow):
 *   PENDING   → PICKING (warehouse begins pick) or CANCELLED
 *   PICKING   → PACKED (items packed and ready) or CANCELLED
 *   PACKED    → SHIPPED (carrier-tracked branch) or COMPLETED (non-carrier
 *               freight branch — LTL, FTL, OCEAN, BOL) or CANCELLED
 *   SHIPPED   → DELIVERED (carrier confirms receipt)
 *   COMPLETED → terminal (non-carrier freight has no DELIVERED state)
 *   DELIVERED → terminal (no outbound transitions)
 *   CANCELLED → terminal (no outbound transitions)
 *
 * The PACKED row encodes the branching split between carrier-tracked parcels
 * and non-carrier freight that the previous linear sequence approximation
 * papered over — SHIPPED and COMPLETED are peer terminals on parallel
 * branches driven by delivery_methods.is_carrier_tracked, not sequential
 * states. Modelling them as a fan-out from PACKED is what makes the graph
 * an honest representation of the lifecycle.
 *
 * Terminal states are encoded as empty arrays; the validator rejects any
 * attempt to transition out of them via a length check, which makes
 * terminal-ness declarative rather than dependent on a separate predicate
 * or on sequence position.
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the fulfillment_status seed,
 *    update both FULFILLMENT_STATUS_CODES and this map in the same commit.
 *    A code that isn't a key here is treated as unknown by the validator
 *    and fails closed.
 */
const ALLOWED_FULFILLMENT_TRANSITIONS = Object.freeze({
  [FULFILLMENT_STATUS_CODES.PENDING]:   [FULFILLMENT_STATUS_CODES.PICKING, FULFILLMENT_STATUS_CODES.PACKED, FULFILLMENT_STATUS_CODES.CANCELLED],
  [FULFILLMENT_STATUS_CODES.PICKING]:   [FULFILLMENT_STATUS_CODES.PACKED, FULFILLMENT_STATUS_CODES.CANCELLED],
  [FULFILLMENT_STATUS_CODES.PACKED]:    [FULFILLMENT_STATUS_CODES.SHIPPED, FULFILLMENT_STATUS_CODES.COMPLETED, FULFILLMENT_STATUS_CODES.CANCELLED],
  [FULFILLMENT_STATUS_CODES.SHIPPED]:   [FULFILLMENT_STATUS_CODES.DELIVERED],
  [FULFILLMENT_STATUS_CODES.COMPLETED]: [],   // terminal
  [FULFILLMENT_STATUS_CODES.DELIVERED]: [],   // terminal
  [FULFILLMENT_STATUS_CODES.CANCELLED]: [],   // terminal
});

/**
 * Fulfillment status codes considered terminal once a shipment is delivered.
 *
 * Used by resolveOrderTargetCodeAfterDelivery to decide DELIVERED vs
 * PARTIALLY_DELIVERED — if every fulfillment on the order is either
 * transitioning in this call or already at one of these codes, the order
 * is fully delivered.
 *
 * CANCELLED is included so a cancelled fulfillment doesn't block an
 * otherwise-complete delivery from marking the order DELIVERED.
 */
const DELIVERED_TERMINAL_FULFILLMENT_STATUS_CODES = [
  FULFILLMENT_STATUS_CODES.DELIVERED,
  FULFILLMENT_STATUS_CODES.CANCELLED,
];

module.exports = {
  FULFILLMENT_STATUS_CODES,
  FULFILLMENT_FINAL_STATUSES,
  TERMINAL_FULFILLMENT_STATUS_CODES,
  CONFIRMED_TERMINAL_FULFILLMENT_STATUS_CODES,
  ALLOWED_FULFILLMENT_TRANSITIONS,
  DELIVERED_TERMINAL_FULFILLMENT_STATUS_CODES,
};
