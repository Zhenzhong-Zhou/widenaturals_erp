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

const SHIPMENT_STATUS_CODES = Object.freeze({
  PENDING: 'SHIPMENT_PENDING',
  READY_FOR_FULFILLMENT: 'SHIPMENT_READY_FOR_FULFILLMENT',
  SHIPPED: 'SHIPMENT_SHIPPED',
  DELIVERED: 'SHIPMENT_DELIVERED',
  PICKED_UP: 'SHIPMENT_PICKED_UP',
  CANCELLED: 'SHIPMENT_CANCELLED',
  RETURNED: 'SHIPMENT_RETURNED',
});

module.exports = {
  SHIPMENT_STATUS_CODES,
};
