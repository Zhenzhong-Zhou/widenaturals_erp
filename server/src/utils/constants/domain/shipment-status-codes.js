/**
 * @file shipment-status-codes.js
 * @description Domain constants for shipment status codes.
 *
 * Mirrors the `code` column on the shipment_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — dispatches updateAllStatuses
 *    between markOutboundShipmentsShipped (stamps shipped_at) and
 *    updateOutboundShipmentStatus (generic) based on the target code
 *  - validation guards that gate workflow transitions on shipment state
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the shipment_status seed,
 *    update this file in the same commit. Mismatches surface as silent
 *    dispatch failures (falls through to generic update without stamping
 *    shipped_at).
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

module.exports = {
  SHIPMENT_STATUS_CODES,
};
