/**
 * @file order-item-queries.js
 * @description SQL query constants for order-item-repository.js.
 *
 * Exports:
 *  - ORDER_ITEM_INSERT_COLUMNS              — ordered column list for bulk insert
 *  - ORDER_ITEM_UPDATE_STRATEGIES           — conflict update strategies
 *  - ORDER_ITEM_EXTRA_UPDATES              — extra SET clauses for subtotal recalc
 *  - ORDER_ITEM_SKU_CONFLICT_COLUMNS       — conflict target for SKU items
 *  - ORDER_ITEM_PACKAGING_CONFLICT_COLUMNS — conflict target for packaging items
 *  - ORDER_ITEM_FIND_BY_ORDER_QUERY        — full detail fetch by order_id
 *  - ORDER_ITEM_GET_BY_ORDER_QUERY         — lightweight fetch by order_id
 *  - ORDER_ITEM_UPDATE_STATUS_BY_ORDER     — bulk status update by order_id
 *  - ORDER_ITEM_UPDATE_STATUS_BY_ID        — single status update by item id
 *  - ORDER_ITEM_VALIDATE_ALLOCATION_QUERY  — existence check for under-allocated items
 *  - ORDER_ITEM_SKU_ACTIVE_ORDERS_QUERY    — existence check for SKU active orders
 */

'use strict';

const { q } = require('../../utils/sql-ident');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertOrderItemsBulk row map.
const ORDER_ITEM_INSERT_COLUMNS = [
  'order_id',
  'sku_id',
  'packaging_material_id',
  'quantity_ordered',
  'price_id',
  'price',
  'subtotal',
  'status_id',
  'metadata',
  'updated_at',
  'created_by',
  'updated_by',
];

const ORDER_ITEM_UPDATE_STRATEGIES = {
  quantity_ordered: 'add',
  price:            'overwrite',
  metadata:         'merge_jsonb',
  updated_at:       'overwrite',
};

// Recalculates subtotal on conflict using the cumulative quantity after add.
const ORDER_ITEM_EXTRA_UPDATES = [
  `subtotal = ROUND(
    EXCLUDED.price * (${q('t')}.${q('quantity_ordered')} + EXCLUDED.${q('quantity_ordered')}),
    2
  )`,
];

// Conflict targets are separated by item type — each has its own unique constraint.
const ORDER_ITEM_SKU_CONFLICT_COLUMNS       = ['order_id', 'sku_id'];
const ORDER_ITEM_PACKAGING_CONFLICT_COLUMNS = ['order_id', 'packaging_material_id'];

// ─── Find By Order (full detail) ─────────────────────────────────────────────

// Full projection including pricing, status, product, and audit fields.
// $1: order_id (UUID)
const ORDER_ITEM_FIND_BY_ORDER_QUERY = `
  SELECT
    oi.id                         AS order_item_id,
    oi.order_id,
    oi.quantity_ordered,
    oi.price_id,
    pr.price                      AS listed_price,
    pt.name                       AS price_type_name,
    oi.price                      AS item_price,
    oi.subtotal                   AS item_subtotal,
    oi.status_id                  AS item_status_id,
    ios.name                      AS item_status_name,
    ios.code                      AS item_status_code,
    oi.status_date                AS item_status_date,
    oi.metadata                   AS item_metadata,
    oi.sku_id,
    s.sku,
    s.barcode,
    s.country_code,
    s.size_label,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
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
    oi.created_at                 AS item_created_at,
    oi.updated_at                 AS item_updated_at,
    oi.created_by                 AS item_created_by,
    ucb.firstname                 AS item_created_by_firstname,
    ucb.lastname                  AS item_created_by_lastname,
    oi.updated_by                 AS item_updated_by,
    uub.firstname                 AS item_updated_by_firstname,
    uub.lastname                  AS item_updated_by_lastname
  FROM order_items oi
  LEFT JOIN order_status        ios ON ios.id = oi.status_id
  LEFT JOIN skus                s   ON s.id   = oi.sku_id
  LEFT JOIN products            p   ON p.id   = s.product_id
  LEFT JOIN packaging_materials pkg ON pkg.id = oi.packaging_material_id
  LEFT JOIN pricing             pr  ON pr.id  = oi.price_id
  LEFT JOIN pricing_types       pt  ON pt.id  = pr.price_type_id
  LEFT JOIN users               ucb ON ucb.id = oi.created_by
  LEFT JOIN users               uub ON uub.id = oi.updated_by
  WHERE oi.order_id = $1
  ORDER BY oi.created_at
`;

// ─── Get By Order (lightweight) ──────────────────────────────────────────────

// Minimal projection for fulfillment and allocation flows.
// $1: order_id (UUID)
const ORDER_ITEM_GET_BY_ORDER_QUERY = `
  SELECT
    oi.id                         AS order_item_id,
    oi.sku_id,
    oi.packaging_material_id,
    oi.quantity_ordered,
    oi.status_id                  AS order_item_status_id,
    os.category                   AS order_items_category,
    os.code                       AS order_item_code,
    s.sku                         AS sku_code,
    s.size_label,
    s.country_code,
    p.name                        AS product_name,
    p.brand,
    pm.code                       AS material_code,
    pm.name                       AS material_name,
    pmb.lot_number                AS material_lot_number,
    pmb.material_snapshot_name    AS material_batch_name
  FROM order_items oi
  JOIN orders o                   ON o.id  = oi.order_id
  JOIN order_status os            ON os.id = oi.status_id
  LEFT JOIN skus s                ON oi.sku_id = s.id
  LEFT JOIN products p            ON s.product_id = p.id
  LEFT JOIN packaging_materials pm
    ON oi.packaging_material_id = pm.id
  LEFT JOIN packaging_material_suppliers pms
    ON pms.packaging_material_id = pm.id
    AND pms.is_preferred = true
  LEFT JOIN packaging_material_batches pmb
    ON pmb.packaging_material_supplier_id = pms.id
  WHERE o.id = $1
`;

// ─── Update Status ────────────────────────────────────────────────────────────

// Bulk update by order_id — skips rows where status already matches.
// $1: new_status_id, $2: updated_by, $3: order_id
const ORDER_ITEM_UPDATE_STATUS_BY_ORDER = `
  UPDATE order_items
  SET
    status_id   = $1,
    status_date = NOW(),
    updated_at  = NOW(),
    updated_by  = $2
  WHERE order_id = $3
    AND status_id IS DISTINCT FROM $1
  RETURNING id, status_id, status_date
`;

// Single update by item id — skips if status already matches.
// $1: new_status_id, $2: updated_by, $3: order_item_id
const ORDER_ITEM_UPDATE_STATUS_BY_ID = `
  UPDATE order_items
  SET
    status_id   = $1,
    status_date = NOW(),
    updated_at  = NOW(),
    updated_by  = $2
  WHERE id = $3
    AND status_id IS DISTINCT FROM $1
  RETURNING id, status_id, status_date
`;

// ─── Allocation Validation ────────────────────────────────────────────────────

// Returns a row if any order item is under-allocated.
// Caller interprets rows.length === 0 as fully allocated.
// $1: order_id (UUID)
const ORDER_ITEM_VALIDATE_ALLOCATION_QUERY = `
  SELECT 1
  FROM order_items oi
  LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
  WHERE oi.order_id = $1
  GROUP BY oi.id, oi.quantity_ordered
  HAVING COALESCE(SUM(ia.allocated_quantity), 0) < oi.quantity_ordered
  LIMIT 1
`;

// ─── SKU Existence Checks ─────────────────────────────────────────────────────

// $1: sku_id, $2: active_order_status_ids (UUID array)
const ORDER_ITEM_SKU_ACTIVE_ORDERS_QUERY = `
  SELECT 1
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.sku_id = $1
    AND o.order_status_id = ANY($2::uuid[])
  LIMIT 1
`;

module.exports = {
  ORDER_ITEM_INSERT_COLUMNS,
  ORDER_ITEM_UPDATE_STRATEGIES,
  ORDER_ITEM_EXTRA_UPDATES,
  ORDER_ITEM_SKU_CONFLICT_COLUMNS,
  ORDER_ITEM_PACKAGING_CONFLICT_COLUMNS,
  ORDER_ITEM_FIND_BY_ORDER_QUERY,
  ORDER_ITEM_GET_BY_ORDER_QUERY,
  ORDER_ITEM_UPDATE_STATUS_BY_ORDER,
  ORDER_ITEM_UPDATE_STATUS_BY_ID,
  ORDER_ITEM_VALIDATE_ALLOCATION_QUERY,
  ORDER_ITEM_SKU_ACTIVE_ORDERS_QUERY,
};
