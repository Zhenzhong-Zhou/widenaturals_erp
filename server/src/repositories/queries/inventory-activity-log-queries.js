/**
 * @file inventory-activity-log-queries.js
 * @description SQL column configuration for inventory-activity-log-repository.js.
 *
 * Exports:
 *  - INVENTORY_ACTIVITY_LOG_COLUMNS        — ordered column list for activity log insert
 *  - INVENTORY_ACTIVITY_AUDIT_LOG_COLUMNS  — ordered column list for audit log insert
 *  - INVENTORY_ACTIVITY_LOG_CONFLICT_COLUMNS      — empty — append-only
 *  - INVENTORY_ACTIVITY_AUDIT_WAREHOUSE_CONFLICT_COLUMNS — conflict target for warehouse-scope audit
 *  - INVENTORY_ACTIVITY_AUDIT_LOCATION_CONFLICT_COLUMNS  — conflict target for location-scope audit
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

const INVENTORY_ACTIVITY_LOG_INSERT_COLUMNS = [
  'warehouse_inventory_id',
  'inventory_action_type_id',
  'adjustment_type_id',
  'previous_quantity',
  'quantity_change',
  'new_quantity',
  'status_id',
  'status_effective_at',
  'reference_type',
  'reference_id',
  'performed_by',
  'comments',
  'checksum',
  'metadata',
  'created_by',
];

// ── Paginated list ──────────────────────────────────────────────────

const INVENTORY_ACTIVITY_LOG_TABLE = 'inventory_activity_log ial';

const INVENTORY_ACTIVITY_LOG_JOINS = [
  'JOIN warehouse_inventory wi             ON wi.id  = ial.warehouse_inventory_id',
  'JOIN inventory_action_types iat         ON iat.id = ial.inventory_action_type_id',
  'JOIN batch_registry br                  ON br.id  = wi.batch_id',
  'LEFT JOIN lot_adjustment_types lat      ON lat.id = ial.adjustment_type_id',
  'LEFT JOIN inventory_status ist          ON ist.id = ial.status_id',
  'LEFT JOIN users u_performed             ON u_performed.id = ial.performed_by',
  'LEFT JOIN product_batches pb            ON pb.id  = br.product_batch_id',
  'LEFT JOIN skus s                        ON s.id   = pb.sku_id',
  'LEFT JOIN products p                    ON p.id   = s.product_id',
  'LEFT JOIN packaging_material_batches pmb ON pmb.id = br.packaging_material_batch_id',
  'LEFT JOIN packaging_material_suppliers pms ON pms.id = pmb.packaging_material_supplier_id',
  'LEFT JOIN packaging_materials pm        ON pm.id  = pms.packaging_material_id',
];

const _INVENTORY_ACTIVITY_LOG_JOINS_SQL = INVENTORY_ACTIVITY_LOG_JOINS.join('\n  ');

const INVENTORY_ACTIVITY_LOG_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.inventoryActivityLogSortMap)
);

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildInventoryActivityLogPaginatedQuery = (whereClause) => `
  SELECT
    ial.id,
    ial.warehouse_inventory_id,
    ial.inventory_action_type_id,
    ial.adjustment_type_id,
    br.batch_type,
    pb.lot_number                 AS product_lot_number,
    p.name                        AS product_name,
    s.sku,
    pmb.lot_number                AS packaging_lot_number,
    pmb.received_label_name       AS packaging_display_name,
    pm.code                       AS packaging_material_code,
    ial.previous_quantity,
    ial.quantity_change,
    ial.new_quantity,
    ial.reference_type,
    ial.reference_id,
    ial.comments,
    ial.performed_by,
    ial.performed_at,
    ial.metadata,
    iat.name                      AS action_type_name,
    iat.category                  AS action_type_category,
    lat.name                      AS adjustment_type_name,
    ial.status_id,
    ist.name                      AS status_name,
    ial.status_effective_at,
    u_performed.firstname         AS performed_by_firstname,
    u_performed.lastname          AS performed_by_lastname,
    wi.warehouse_id
  FROM ${INVENTORY_ACTIVITY_LOG_TABLE}
  ${_INVENTORY_ACTIVITY_LOG_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  INVENTORY_ACTIVITY_LOG_INSERT_COLUMNS,
  INVENTORY_ACTIVITY_LOG_TABLE,
  INVENTORY_ACTIVITY_LOG_JOINS,
  INVENTORY_ACTIVITY_LOG_SORT_WHITELIST,
  buildInventoryActivityLogPaginatedQuery,
};
