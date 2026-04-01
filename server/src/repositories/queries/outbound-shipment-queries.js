/**
 * @file outbound-shipment-queries.js
 * @description SQL query constants and factory functions for
 * outbound-shipment-repository.js.
 *
 * Exports:
 *  - OUTBOUND_SHIPMENT_INSERT_COLUMNS      — ordered column list for bulk insert
 *  - OUTBOUND_SHIPMENT_CONFLICT_COLUMNS    — upsert conflict target columns
 *  - OUTBOUND_SHIPMENT_UPDATE_STRATEGIES   — conflict update strategies
 *  - OUTBOUND_SHIPMENT_GET_BY_ID_QUERY     — fetch single shipment by id
 *  - OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY — bulk status update by id array
 *  - OUTBOUND_SHIPMENT_TABLE               — aliased table name for paginated query
 *  - OUTBOUND_SHIPMENT_JOINS               — join array for paginated query
 *  - OUTBOUND_SHIPMENT_SORT_WHITELIST      — valid sort fields for paginated query
 *  - buildOutboundShipmentPaginatedQuery   — factory for paginated list query
 *  - OUTBOUND_SHIPMENT_DETAILS_QUERY       — full detail fetch by shipment id
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertOutboundShipmentsBulk row map.
const OUTBOUND_SHIPMENT_INSERT_COLUMNS = [
  'order_id',
  'warehouse_id',
  'delivery_method_id',
  'tracking_number_id',
  'status_id',
  'shipped_at',
  'expected_delivery_date',
  'notes',
  'shipment_details',
  'created_by',
  'updated_by',
  'updated_at',
];

// Conflict target: a shipment is considered duplicate when both match.
const OUTBOUND_SHIPMENT_CONFLICT_COLUMNS = ['order_id', 'warehouse_id'];

const OUTBOUND_SHIPMENT_UPDATE_STRATEGIES = {
  status_id:              'overwrite',
  shipped_at:             'overwrite',
  expected_delivery_date: 'overwrite',
  notes:                  'merge_text',
  shipment_details:       'overwrite',
  updated_by:             'overwrite',
  updated_at:             'overwrite',
};

// ─── Single Record ────────────────────────────────────────────────────────────

// $1: shipment_id (UUID)
const OUTBOUND_SHIPMENT_GET_BY_ID_QUERY = `
  SELECT
    os.id                         AS shipment_id,
    os.order_id,
    os.warehouse_id,
    os.status_id,
    ss.code                       AS status_code,
    ss.name                       AS status_name,
    ss.is_final                   AS status_is_final,
    dm.id                         AS delivery_method_id,
    dm.method_name                AS delivery_method_name,
    dm.is_pickup_location         AS is_pickup_location,
    dm.estimated_time             AS delivery_estimated_time
  FROM outbound_shipments os
  LEFT JOIN shipment_status  ss ON ss.id = os.status_id
  LEFT JOIN delivery_methods dm ON dm.id = os.delivery_method_id
  WHERE os.id = $1
`;

// ─── Update Status ────────────────────────────────────────────────────────────

// $1: status_id, $2: user_id, $3: shipment_ids (UUID array)
const OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY = `
  UPDATE outbound_shipments
  SET
    status_id  = $1,
    shipped_at = NOW(),
    updated_at = NOW(),
    updated_by = $2
  WHERE id = ANY($3::uuid[])
  RETURNING id
`;

// ─── Paginated List ───────────────────────────────────────────────────────────

const OUTBOUND_SHIPMENT_TABLE = 'outbound_shipments os';

const OUTBOUND_SHIPMENT_JOINS = [
  'LEFT JOIN orders           o  ON os.order_id           = o.id',
  'LEFT JOIN warehouses       w  ON os.warehouse_id       = w.id',
  'LEFT JOIN delivery_methods dm ON os.delivery_method_id = dm.id',
  'LEFT JOIN tracking_numbers tn ON os.tracking_number_id = tn.id',
  'LEFT JOIN shipment_status  ss ON os.status_id          = ss.id',
  'LEFT JOIN users            u1 ON os.created_by         = u1.id',
  'LEFT JOIN users            u2 ON os.updated_by         = u2.id',
];

const _OUTBOUND_SHIPMENT_JOINS_SQL = OUTBOUND_SHIPMENT_JOINS.join('\n  ');

const OUTBOUND_SHIPMENT_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.outboundShipmentSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildOutboundShipmentFilter.
 * @returns {string}
 */
const buildOutboundShipmentPaginatedQuery = (whereClause) => `
  SELECT
    os.id                         AS shipment_id,
    os.order_id,
    o.order_number,
    os.warehouse_id,
    w.name                        AS warehouse_name,
    os.delivery_method_id,
    dm.method_name                AS delivery_method,
    os.tracking_number_id,
    tn.tracking_number,
    os.status_id,
    ss.code                       AS status_code,
    ss.name                       AS status_name,
    os.shipped_at,
    os.expected_delivery_date,
    os.notes,
    os.shipment_details,
    os.created_at,
    os.updated_at,
    os.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    os.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM ${OUTBOUND_SHIPMENT_TABLE}
  ${_OUTBOUND_SHIPMENT_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// Full detail projection including fulfillments, batches, and all audit fields.
// Returns multiple rows per shipment — one per fulfillment/batch combination.
// $1: shipment_id (UUID)
const OUTBOUND_SHIPMENT_DETAILS_QUERY = `
  SELECT
    os.id                         AS shipment_id,
    os.order_id,
    os.warehouse_id,
    ws.name                       AS warehouse_name,
    os.delivery_method_id,
    dm.method_name                AS delivery_method_name,
    dm.is_pickup_location         AS delivery_method_is_pickup,
    dm.estimated_time             AS delivery_method_estimated_time,
    os.status_id                  AS shipment_status_id,
    ss.code                       AS shipment_status_code,
    ss.name                       AS shipment_status_name,
    os.shipped_at,
    os.expected_delivery_date,
    os.notes                      AS shipment_notes,
    os.shipment_details,
    os.created_at,
    os.created_by,
    created_by_user.firstname     AS shipment_created_by_firstname,
    created_by_user.lastname      AS shipment_created_by_lastname,
    os.updated_at,
    os.updated_by,
    updated_by_user.firstname     AS shipment_updated_by_firstname,
    updated_by_user.lastname      AS shipment_updated_by_lastname,
    tn.id                         AS tracking_id,
    tn.tracking_number,
    tn.carrier,
    tn.service_name,
    tn.bol_number,
    tn.freight_type,
    tn.custom_notes               AS tracking_notes,
    tn.shipped_date               AS tracking_shipped_date,
    tn.status_id                  AS tracking_status_id,
    ts.name                       AS tracking_status_name,
    of.id                         AS fulfillment_id,
    of.quantity_fulfilled,
    of.fulfilled_at,
    of.fulfillment_notes,
    of.status_id                  AS fulfillment_status_id,
    fs.code                       AS fulfillment_status_code,
    fs.name                       AS fulfillment_status_name,
    of.created_at                 AS fulfillment_created_at,
    of.created_by                 AS fulfillment_created_by,
    fulfillment_created_by_user.firstname AS fulfillment_created_by_firstname,
    fulfillment_created_by_user.lastname  AS fulfillment_created_by_lastname,
    of.updated_at                 AS fulfillment_updated_at,
    of.updated_by                 AS fulfillment_updated_by,
    fulfillment_updated_by_user.firstname AS fulfillment_updated_by_firstname,
    fulfillment_updated_by_user.lastname  AS fulfillment_updated_by_lastname,
    of.fulfilled_by,
    fulfillment_fulfilled_by_user.firstname AS fulfillment_fulfilled_by_firstname,
    fulfillment_fulfilled_by_user.lastname  AS fulfillment_fulfilled_by_lastname,
    oi.id                         AS order_item_id,
    oi.quantity_ordered,
    s.id                          AS sku_id,
    s.sku,
    s.barcode,
    s.country_code,
    s.size_label,
    s.market_region,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.series,
    p.category,
    oi.packaging_material_id,
    pkg.code                      AS packaging_material_code,
    pkg.name                      AS packaging_material_name,
    pkg.color                     AS packaging_material_color,
    pkg.size                      AS packaging_material_size,
    pkg.unit                      AS packaging_material_unit,
    pkg.length_cm                 AS packaging_material_length_cm,
    pkg.width_cm                  AS packaging_material_width_cm,
    pkg.height_cm                 AS packaging_material_height_cm,
    sb.id                         AS shipment_batch_id,
    sb.quantity_shipped,
    sb.notes                      AS shipment_batch_notes,
    sb.created_at                 AS shipment_batch_created_at,
    sb.created_by                 AS shipment_batch_created_by,
    shipment_batch_created_by_user.firstname AS shipment_batch_created_by_firstname,
    shipment_batch_created_by_user.lastname  AS shipment_batch_created_by_lastname,
    br.id                         AS batch_registry_id,
    br.batch_type,
    pb.lot_number                 AS product_lot_number,
    pb.expiry_date                AS product_expiry_date,
    pmb.id                        AS packaging_material_batch_id,
    pmb.lot_number                AS material_lot_number,
    pmb.expiry_date               AS material_expiry_date,
    pmb.material_snapshot_name,
    pmb.received_label_name
  FROM outbound_shipments os
  LEFT JOIN warehouses ws                       ON ws.id  = os.warehouse_id
  LEFT JOIN delivery_methods dm                 ON dm.id  = os.delivery_method_id
  LEFT JOIN shipment_status ss                  ON ss.id  = os.status_id
  LEFT JOIN tracking_numbers tn                 ON tn.id  = os.tracking_number_id
  LEFT JOIN status ts                           ON ts.id  = tn.status_id
  LEFT JOIN users created_by_user               ON created_by_user.id  = os.created_by
  LEFT JOIN users updated_by_user               ON updated_by_user.id  = os.updated_by
  LEFT JOIN order_fulfillments of               ON of.shipment_id      = os.id
  LEFT JOIN fulfillment_status fs               ON fs.id  = of.status_id
  LEFT JOIN users fulfillment_created_by_user   ON fulfillment_created_by_user.id  = of.created_by
  LEFT JOIN users fulfillment_updated_by_user   ON fulfillment_updated_by_user.id  = of.updated_by
  LEFT JOIN users fulfillment_fulfilled_by_user ON fulfillment_fulfilled_by_user.id = of.fulfilled_by
  LEFT JOIN order_items oi                      ON oi.id  = of.order_item_id
  LEFT JOIN skus s                              ON s.id   = oi.sku_id
  LEFT JOIN products p                          ON p.id   = s.product_id
  LEFT JOIN packaging_materials pkg             ON pkg.id = oi.packaging_material_id
  LEFT JOIN shipment_batches sb                 ON sb.fulfillment_id = of.id
  LEFT JOIN batch_registry br                   ON br.id  = sb.batch_id
  LEFT JOIN product_batches pb                  ON br.product_batch_id = pb.id
  LEFT JOIN packaging_material_batches pmb      ON br.packaging_material_batch_id = pmb.id
  LEFT JOIN users shipment_batch_created_by_user ON shipment_batch_created_by_user.id = sb.created_by
  WHERE os.id = $1
`;

module.exports = {
  OUTBOUND_SHIPMENT_INSERT_COLUMNS,
  OUTBOUND_SHIPMENT_CONFLICT_COLUMNS,
  OUTBOUND_SHIPMENT_UPDATE_STRATEGIES,
  OUTBOUND_SHIPMENT_GET_BY_ID_QUERY,
  OUTBOUND_SHIPMENT_UPDATE_STATUS_QUERY,
  OUTBOUND_SHIPMENT_TABLE,
  OUTBOUND_SHIPMENT_JOINS,
  OUTBOUND_SHIPMENT_SORT_WHITELIST,
  buildOutboundShipmentPaginatedQuery,
  OUTBOUND_SHIPMENT_DETAILS_QUERY,
};
