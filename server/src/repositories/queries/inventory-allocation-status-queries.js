/**
 * @file inventory-allocation-status-queries.js
 * @description SQL query constants for inventory-allocation-status-repository.js.
 *
 * Exports:
 *  - INVENTORY_ALLOCATION_STATUS_GET_BY_CODES — bulk fetch status records by code array
 */

'use strict';

// Bulk fetch by code array — used to resolve allocation status IDs from
// human-readable codes before writing to inventory records.
// $1: status code array (string[])
const INVENTORY_ALLOCATION_STATUS_GET_BY_CODES = `
  SELECT id, code
  FROM inventory_allocation_status
  WHERE code = ANY($1)
`;

module.exports = {
  INVENTORY_ALLOCATION_STATUS_GET_BY_CODES,
};
