/**
 * @file order-status-queries.js
 * @description SQL query constants for order-status-repository.js.
 *
 * Exports:
 *  - ORDER_STATUS_GET_BY_CODE    — fetch single status record by code
 *  - ORDER_STATUS_GET_BY_CODES   — bulk fetch status records by code array
 */

'use strict';

// $1: status code (string)
const ORDER_STATUS_GET_BY_CODE = `
  SELECT id, code, category
  FROM order_status
  WHERE code = $1
  LIMIT 1
`;

// $1: status codes (string array)
const ORDER_STATUS_GET_BY_CODES = `
  SELECT id, code, category
  FROM order_status
  WHERE code = ANY($1::text[])
`;

module.exports = {
  ORDER_STATUS_GET_BY_CODE,
  ORDER_STATUS_GET_BY_CODES,
};
