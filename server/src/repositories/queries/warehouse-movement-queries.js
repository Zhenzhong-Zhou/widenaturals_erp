/**
 * @file warehouse-movement-queries.js
 * @description
 * SQL query constants for warehouse movement lookups.
 *
 * Exports:
 *  - WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY — fetch recent movements for an inventory record
 */

'use strict';

// ── Movement queries ────────────────────────────────────────────────

const WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY = `
  SELECT
    wm.id,
    wm.movement_type,
    wm.from_zone_code,
    wm.to_zone_code,
    wm.quantity,
    wm.reference_type,
    wm.reference_id,
    wm.notes,
    wm.performed_at,
    wm.performed_by,
    u.firstname AS performed_by_firstname,
    u.lastname  AS performed_by_lastname
  FROM warehouse_movements wm
  LEFT JOIN users u ON u.id = wm.performed_by
  WHERE wm.warehouse_inventory_id = $1
  ORDER BY wm.performed_at DESC
  LIMIT 20
`;

module.exports = {
  WAREHOUSE_MOVEMENTS_BY_INVENTORY_ID_QUERY,
};
