/**
 * @file transfer-order-item-status-queries.js
 * @description SQL query constants for transfer-order-item-status-repository.js.
 *
 * Exports:
 *  - GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY — fetch status rows matching a code array
 */

'use strict';

// $1: status codes (text[])
const GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY = `
  SELECT id, code
  FROM transfer_order_item_status
  WHERE code = ANY($1)
`;

module.exports = {
  GET_TRANSFER_ITEM_STATUSES_BY_CODES_QUERY,
};
