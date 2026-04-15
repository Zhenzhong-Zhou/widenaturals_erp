/**
 * @file inventory-status-queries.js
 * @description
 * SQL query constants for inventory status lookups.
 *
 * Exports:
 *  - VALIDATE_INVENTORY_STATUS_IDS_QUERY — existence check for a set of status IDs
 *  - GET_INVENTORY_STATUS_BY_ID_QUERY    — fetch a single status record by ID
 */

'use strict';

const VALIDATE_INVENTORY_STATUS_IDS_QUERY = `
  SELECT id
  FROM inventory_status
  WHERE id = ANY($1::uuid[])
`;

const GET_INVENTORY_STATUS_BY_ID_QUERY = `
  SELECT id FROM inventory_status WHERE id = $1
`;

module.exports = {
  VALIDATE_INVENTORY_STATUS_IDS_QUERY,
  GET_INVENTORY_STATUS_BY_ID_QUERY,
};