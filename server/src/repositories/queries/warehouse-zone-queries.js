/**
 * @file warehouse-zone-queries.js
 * @description
 * SQL query constants for warehouse zone lookups.
 *
 * Exports:
 *  - WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY — fetch all zone assignments for an inventory record
 */

'use strict';

// ── Zone queries ────────────────────────────────────────────────────

const WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY = `
  SELECT
    wz.id,
    wz.zone_code,
    wz.quantity,
    wz.reserved_quantity,
    (wz.quantity - wz.reserved_quantity) AS available_quantity,
    wz.zone_entry_date,
    wz.zone_exit_date
  FROM warehouse_zones wz
  WHERE wz.warehouse_inventory_id = $1
  ORDER BY wz.zone_entry_date ASC
`;

module.exports = {
  WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY,
};
