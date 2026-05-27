/**
 * @file shipment-status-codes.js
 * @description Domain constants for shipment status codes.
 *
 * Mirrors the `code` column on the shipment_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — dispatches updateShipmentsStatus
 *    between markOutboundShipmentsShipped (stamps shipped_at when the target
 *    is in SHIPPED_AT_STAMPING_STATUSES) and updateOutboundShipmentStatus
 *    (generic, no stamping)
 *  - validateStatusesBeforeConfirmation /
 *    validateStatusesBeforeOutboundFulfillmentCompletion — gate workflow
 *    transitions on the current shipment state
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the shipment_status seed,
 *    update both SHIPMENT_STATUS_CODES and SHIPPED_AT_STAMPING_STATUSES
 *    membership in the same commit. Mismatches surface as silent dispatch
 *    failures (a code that should stamp shipped_at falls through to the
 *    generic update path because it's not in the stamping set, or vice
 *    versa — a non-shipping code accidentally stamps shipped_at).
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

module.exports = {
  SHIPMENT_STATUS_CODES,
  SHIPPED_AT_STAMPING_STATUSES,
};
