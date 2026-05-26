/**
 * @file fulfillment-status-codes.js
 * @description Domain constants for fulfillment status codes.
 *
 * Mirrors the `code` column on the fulfillment_status lookup table.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Used by:
 *  - outbound-fulfillment-business.js — terminal-state detection via
 *    TERMINAL_FULFILLMENT_STATUS_CODES, target code resolution
 *  - resolveOrderTargetCodeAfterFulfillment — checks if every fulfillment
 *    on an order is terminal to decide SHIPPED vs FULFILLED
 *
 * Sync requirement:
 *  - If a code is added, removed, or renamed in the fulfillment_status seed,
 *    update this file in the same commit. Mismatches surface as cache misses
 *    in status resolution and silent dispatch failures.
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

module.exports = {
  FULFILLMENT_STATUS_CODES,
};
