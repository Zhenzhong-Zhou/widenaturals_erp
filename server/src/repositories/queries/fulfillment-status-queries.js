/**
 * @file fulfillment-status-queries.js
 * @description SQL query constants for fulfillment-status-repository.js.
 *
 * Exports:
 *  - FULFILLMENT_STATUS_GET_BY_CODE  — fetch single status record by code
 *  - FULFILLMENT_STATUS_GET_BY_IDS   — bulk fetch status records by id array
 */

'use strict';

// Minimal projection for status resolution — returns shape fields only.
// $1: status code (string)
const FULFILLMENT_STATUS_GET_BY_CODE = `
  SELECT id, code, sort_order, category, is_default
  FROM fulfillment_status
  WHERE code = $1
  LIMIT 1
`;

// Bulk fetch by id array — $1 must be a UUID array.
const FULFILLMENT_STATUS_GET_BY_IDS = `
  SELECT DISTINCT id, code, name
  FROM fulfillment_status
  WHERE id = ANY($1::uuid[])
`;

module.exports = {
  FULFILLMENT_STATUS_GET_BY_CODE,
  FULFILLMENT_STATUS_GET_BY_IDS,
};
