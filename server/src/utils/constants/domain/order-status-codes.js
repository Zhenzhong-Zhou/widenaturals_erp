/**
 * @file order-status-codes.js
 * @description Canonical order status code constants matching the `code` column
 *   of the order_status lookup table.
 *
 * Single source of truth — never inline these string literals elsewhere in the
 * codebase. Use ORDER_STATUS_CODES.X and let imports surface unused/missing keys.
 *
 * Exports:
 *  - ORDER_STATUS_CODES — frozen map of UPPER_SNAKE keys to DB code strings
 */

/**
 * @typedef {typeof ORDER_STATUS_CODES[keyof typeof ORDER_STATUS_CODES]} OrderStatusCode
 *   String literal union of every value in ORDER_STATUS_CODES.
 */
const ORDER_STATUS_CODES = Object.freeze({
  // ── Pre-fulfillment ────────────────────────────────────
  PENDING:              'ORDER_PENDING',
  EDITED:               'ORDER_EDITED',
  AWAITING_REVIEW:      'ORDER_AWAITING_REVIEW',
  CONFIRMED:            'ORDER_CONFIRMED',
  
  // ── Allocation ─────────────────────────────────────────
  ALLOCATING:           'ORDER_ALLOCATING',
  PARTIALLY_ALLOCATED:  'ORDER_PARTIALLY_ALLOCATED',
  ALLOCATED:            'ORDER_ALLOCATED',
  BACKORDERED:          'ORDER_BACKORDERED',
  
  // ── Fulfillment & shipping ─────────────────────────────
  PROCESSING:           'ORDER_PROCESSING',
  PARTIALLY_FULFILLED:  'ORDER_PARTIALLY_FULFILLED',
  SHIPPED:              'ORDER_SHIPPED',
  OUT_FOR_DELIVERY:     'ORDER_OUT_FOR_DELIVERY',
  FULFILLED:            'ORDER_FULFILLED',
  DELIVERED:            'ORDER_DELIVERED',
  
  // ── Terminal / non-happy paths ─────────────────────────
  CANCELED:             'ORDER_CANCELED',
  RETURN_REQUESTED:     'RETURN_REQUESTED',
  RETURN_COMPLETED:     'RETURN_COMPLETED',
});

module.exports = {
  ORDER_STATUS_CODES,
};
