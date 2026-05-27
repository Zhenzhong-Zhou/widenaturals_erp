/**
 * @file fulfillment-status-queries.js
 * @description SQL query constants for fulfillment-status-repository.js.
 *
 * Exports:
 *  - FULFILLMENT_STATUS_GET_BY_CODE  — fetch single status record by code
 *  - FULFILLMENT_STATUS_GET_BY_IDS   — bulk fetch status records by id array
 */

'use strict';

// Bulk fetch by id array — $1 must be a UUID array.
const FULFILLMENT_STATUS_GET_BY_IDS = `
  SELECT DISTINCT id, code, name
  FROM fulfillment_status
  WHERE id = ANY($1::uuid[])
`;

module.exports = {
  FULFILLMENT_STATUS_GET_BY_IDS,
};
