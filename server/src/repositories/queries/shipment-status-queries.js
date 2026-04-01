/**
 * @file shipment-status-queries.js
 * @description SQL query constants for shipment-status-repository.js.
 *
 * Exports:
 *  - SHIPMENT_STATUS_GET_BY_CODE — fetch single shipment status by code
 */

'use strict';

// $1: status code (string)
const SHIPMENT_STATUS_GET_BY_CODE = `
  SELECT id, code, is_final
  FROM shipment_status
  WHERE code = $1
  LIMIT 1
`;

module.exports = {
  SHIPMENT_STATUS_GET_BY_CODE,
};
