/**
 * @file shipment-status-codes.js
 * @description Domain constants for shipment status codes.
 *
 * Mirrors the `code` column on the shipment_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — dispatches updateShipmentsStatus
 *    between three paths based on the target code:
 *    markOutboundShipmentsShipped (when in SHIPPED_AT_STAMPING_STATUSES),
 *    markOutboundShipmentsDelivered (when in DELIVERED_AT_STAMPING_STATUSES),
 *    and updateOutboundShipmentStatus (generic, no stamping)
 *  - validateShipmentStatusTransition — graph-based transition validation
 *    against ALLOWED_SHIPMENT_TRANSITIONS (single source of truth for which
 *    shipment state moves are legal, including terminal states with empty
 *    target lists: COMPLETED, CANCELLED, RETURNED)
 *  - validateStatusesBeforeConfirmation /
 *    validateStatusesBeforeOutboundFulfillmentCompletion /
 *    validateStatusesBeforeShipmentDelivery — gate workflow transitions
 *    on the current shipment state
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the shipment_status seed,
 *    update SHIPMENT_STATUS_CODES, ALLOWED_SHIPMENT_TRANSITIONS, and the
 *    stamping sets (SHIPPED_AT_STAMPING_STATUSES,
 *    DELIVERED_AT_STAMPING_STATUSES) in the same commit. Mismatches surface
 *    as silent dispatch failures (a code that should stamp shipped_at /
 *    delivered_at falls through to the generic update path because it's
 *    not in the stamping set, or vice versa), or transitions failing closed
 *    at the validator because they're missing from
 *    ALLOWED_SHIPMENT_TRANSITIONS.
 */

'use strict';

/**
 * @typedef {typeof SHIPMENT_STATUS_CODES[keyof typeof SHIPMENT_STATUS_CODES]} ShipmentStatusCode
 *   String literal union of every value in SHIPMENT_STATUS_CODES.
 */
const SHIPMENT_STATUS_CODES = Object.freeze({
  PENDING:    'SHIPMENT_PENDING',
  READY:      'SHIPMENT_READY',
  IN_TRANSIT: 'SHIPMENT_IN_TRANSIT',
  COMPLETED:  'SHIPMENT_COMPLETED', // triggers shipped_at stamp via markOutboundShipmentsShipped
  DELIVERED:  'SHIPMENT_DELIVERED',
  CANCELLED:  'SHIPMENT_CANCELLED',
  RETURNED:   'SHIPMENT_RETURNED',
});

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

/**
 * Shipment status codes whose entry transition marks the moment a shipment
 * has physically left the warehouse and therefore requires `shipped_at` to
 * be stamped on the row.
 *
 * Used by `updateShipmentsStatus` to dispatch between:
 *  - `markOutboundShipmentsShipped` — stamps `shipped_at = NOW()` alongside
 *    the status change, for transitions *into* one of these codes
 *  - `updateOutboundShipmentStatus` — generic status update, no timestamp
 *    side effect, for all other target codes
 *
 * Membership rationale:
 *  - IN_TRANSIT — carrier-tracked parcel handed off to the carrier
 *  - COMPLETED  — non-carrier freight (LTL, FTL, OCEAN, BOL) terminal state,
 *                 also the moment the shipment leaves the warehouse
 */
const SHIPPED_AT_STAMPING_STATUSES = [
  SHIPMENT_STATUS_CODES.IN_TRANSIT,
  SHIPMENT_STATUS_CODES.COMPLETED,
];

/**
 * Graph of allowed shipment status transitions.
 *
 * Keyed by the current status code; each value is the list of legal next
 * codes. Terminal states resolve to an empty array — COMPLETED (terminal for
 * non-carrier freight, e.g. LTL/FTL/OCEAN/BOL), DELIVERED's only successor
 * RETURNED aside, plus CANCELLED and RETURNED themselves.
 *
 * Two parallel "done" branches:
 *   - Carrier-tracked parcels:     READY → IN_TRANSIT → DELIVERED (→ RETURNED)
 *   - Non-carrier freight:         READY → COMPLETED (terminal)
 *
 * Used by validateShipmentStatusTransition as the single source of truth for
 * which shipment state moves are legal. Adding a new status code requires
 * updating both SHIPMENT_STATUS_CODES and this map in the same commit.
 */
const ALLOWED_SHIPMENT_TRANSITIONS = Object.freeze({
  [SHIPMENT_STATUS_CODES.PENDING]:    [SHIPMENT_STATUS_CODES.READY, SHIPMENT_STATUS_CODES.CANCELLED],
  [SHIPMENT_STATUS_CODES.READY]:      [SHIPMENT_STATUS_CODES.IN_TRANSIT, SHIPMENT_STATUS_CODES.COMPLETED, SHIPMENT_STATUS_CODES.CANCELLED],
  [SHIPMENT_STATUS_CODES.IN_TRANSIT]: [SHIPMENT_STATUS_CODES.DELIVERED, SHIPMENT_STATUS_CODES.RETURNED],
  [SHIPMENT_STATUS_CODES.COMPLETED]:  [],                                  // terminal for non-carrier freight
  [SHIPMENT_STATUS_CODES.DELIVERED]:  [SHIPMENT_STATUS_CODES.RETURNED],
  [SHIPMENT_STATUS_CODES.CANCELLED]:  [],                                  // terminal
  [SHIPMENT_STATUS_CODES.RETURNED]:   [],                                  // terminal
});

/**
 * Shipment status codes that should stamp `delivered_at` when entered.
 *
 * Routing predicate for updateShipmentsStatus — when the resolved target
 * code is in this set, the dispatch goes through markOutboundShipmentsDelivered
 * (which writes status_id + delivered_at atomically) rather than the generic
 * updateOutboundShipmentStatus path.
 *
 * Currently a single-element array, but kept as an array for parallelism
 * with SHIPPED_AT_STAMPING_STATUSES (which holds IN_TRANSIT and COMPLETED)
 * and to make future additions a one-line change.
 */
const DELIVERED_AT_STAMPING_STATUSES = [SHIPMENT_STATUS_CODES.DELIVERED];

module.exports = {
  SHIPMENT_STATUS_CODES,
  SHIPPED_AT_STAMPING_STATUSES,
  ALLOWED_SHIPMENT_TRANSITIONS,
  DELIVERED_AT_STAMPING_STATUSES,
};
