/**
 * @file inventory-allocation-queries.js
 * @description SQL query constants for inventory-allocation-repository.js.
 *
 * Dynamic queries (getAllocationsByOrderId, getAllocationStatuses) use base
 * constants with conditional appends in the repository — both are documented here.
 *
 * Exports:
 *  - INVENTORY_ALLOCATION_INSERT_COLUMNS       — ordered column list for bulk insert
 *  - INVENTORY_ALLOCATION_CONFLICT_COLUMNS     — upsert conflict target columns
 *  - INVENTORY_ALLOCATION_UPDATE_STRATEGIES    — conflict update strategies
 *  - INVENTORY_ALLOCATION_EXTRA_UPDATES        — extra SET clauses for conflict update
 *  - INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY  — update status by id array
 *  - INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY — CTE to find mismatched allocation ids
 *  - INVENTORY_ALLOCATION_REVIEW_QUERY         — CTE-based full allocation review
 *  - INVENTORY_ALLOCATION_PAGINATED_SORT_WHITELIST — valid sort fields for paginated query
 *  - INVENTORY_ALLOCATION_BASE_QUERY           — base CTE for paginated allocations
 *  - INVENTORY_ALLOCATION_BY_ORDER_BASE        — base query for getAllocationsByOrderId
 *  - INVENTORY_ALLOCATION_STATUSES_BASE        — base query for getAllocationStatuses
 *  - SKU_ACTIVE_ALLOCATIONS_QUERY              — exists check for active SKU allocations
 */

'use strict';

const { q } = require('../../utils/sql-ident');
const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertInventoryAllocationsBulk row map.
const INVENTORY_ALLOCATION_INSERT_COLUMNS = [
  'order_item_id',
  'transfer_order_item_id',
  'warehouse_id',
  'batch_id',
  'allocated_quantity',
  'status_id',
  'allocated_at',
  'created_by',
  'updated_by',
  'updated_at',
];

// Conflict target: duplicate when all three match.
const INVENTORY_ALLOCATION_CONFLICT_COLUMNS = [
  'target_item_id',
  'batch_id',
  'warehouse_id',
];

const INVENTORY_ALLOCATION_UPDATE_STRATEGIES = {
  allocated_quantity: 'overwrite',
  status_id:          'overwrite',
  updated_by:         'overwrite',
};

// Extra SET clauses applied on conflict — timestamps always refreshed.
const INVENTORY_ALLOCATION_EXTRA_UPDATES = [
  `${q('allocated_at')} = NOW()`,
  `${q('updated_at')} = NOW()`,
];

// ─── Update Status ────────────────────────────────────────────────────────────

// $1: status_id, $2: user_id, $3: allocation_ids (UUID array)
const INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY = `
  UPDATE inventory_allocations
  SET
    status_id    = $1,
    allocated_at = NOW(),
    updated_at   = NOW(),
    updated_by   = $2
  WHERE id = ANY($3::uuid[])
  RETURNING id
`;

// ─── Mismatched IDs ───────────────────────────────────────────────────────────

// Returns allocation IDs from the input that do not belong to the given order.
// Used to validate allocation ownership before bulk status updates.
// $1: order_id, $2: allocation_ids (UUID array)
const INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY = `
  WITH input_ids AS (
    SELECT unnest($2::uuid[]) AS id
  ),
  valid_allocations AS (
    SELECT ia.id
    FROM inventory_allocations ia
    JOIN order_items oi ON ia.order_item_id = oi.id
    WHERE oi.order_id = $1
      AND ia.id = ANY($2::uuid[])
  )
  SELECT i.id
  FROM input_ids i
  LEFT JOIN valid_allocations v ON v.id = i.id
  WHERE v.id IS NULL
`;

// ─── Allocation Review ────────────────────────────────────────────────────────

// CTE-based full allocation review — includes warehouse inventory aggregation,
// batch details, order metadata, and packaging material joins.
// $1: order_id, $2: warehouse_ids (UUID array), $3: allocation_ids (UUID array)
const INVENTORY_ALLOCATION_REVIEW_QUERY = `
  WITH input_ids AS (
    SELECT
      $2::uuid[] AS warehouse_ids,
      $3::uuid[] AS allocation_ids
  ),
  order_items_filtered AS (
    SELECT
      oi.id,
      oi.order_id,
      oi.quantity_ordered,
      oi.status_id,
      oi.status_date,
      oi.sku_id,
      oi.packaging_material_id
    FROM order_items oi
    WHERE oi.order_id = $1
  ),
  selected_allocations AS (
    SELECT
      ia.id                         AS allocation_id,
      oi.id                         AS order_item_id,
      oi.order_id,
      oi.quantity_ordered,
      oi.status_id                  AS item_status_id,
      oi.status_date                AS item_status_date,
      oi.sku_id,
      oi.packaging_material_id,
      ia.transfer_order_item_id,
      ia.warehouse_id,
      ia.batch_id,
      ia.allocated_quantity,
      ia.status_id                  AS allocation_status_id,
      ia.allocated_at,
      ia.created_at,
      ia.updated_at,
      ia.created_by,
      ia.updated_by
    FROM order_items_filtered oi
    LEFT JOIN inventory_allocations ia ON ia.order_item_id = oi.id
    JOIN input_ids i ON TRUE
    WHERE
      (
        ia.id IS NULL
        OR COALESCE(cardinality(i.warehouse_ids), 0) = 0
        OR ia.warehouse_id = ANY(i.warehouse_ids)
      )
      AND (
        ia.id IS NULL
        OR COALESCE(cardinality(i.allocation_ids), 0) = 0
        OR ia.id = ANY(i.allocation_ids)
      )
  ),
  warehouse_inventory_agg AS (
    SELECT
      wi.batch_id,
      jsonb_agg(
        jsonb_build_object(
          'warehouse_inventory_id',  wi.id,
          'inbound_date',            wi.inbound_date,
          'warehouse_quantity',      wi.warehouse_quantity,
          'reserved_quantity',       wi.reserved_quantity,
          'inventory_status_date',   wi.status_date,
          'inventory_status_name',   invs.name,
          'warehouse_name',          w.name
        )
        ORDER BY wi.inbound_date NULLS LAST, wi.id
      ) AS wi_list
    FROM warehouse_inventory wi
    LEFT JOIN inventory_status invs ON invs.id = wi.status_id
    LEFT JOIN warehouses w          ON w.id = wi.warehouse_id
    JOIN input_ids x ON TRUE
    WHERE
      COALESCE(cardinality(x.warehouse_ids), 0) = 0
      OR wi.warehouse_id = ANY(x.warehouse_ids)
    GROUP BY wi.batch_id
  )
  SELECT
    sa.allocation_id,
    sa.order_item_id,
    sa.transfer_order_item_id,
    sa.batch_id,
    sa.allocated_quantity,
    sa.allocation_status_id,
    s_alloc_status.name             AS allocation_status_name,
    s_alloc_status.code             AS allocation_status_code,
    sa.created_at                   AS allocation_created_at,
    sa.updated_at                   AS allocation_updated_at,
    sa.created_by                   AS allocation_created_by,
    ucb.firstname                   AS allocation_created_by_firstname,
    ucb.lastname                    AS allocation_created_by_lastname,
    sa.updated_by                   AS allocation_updated_by,
    uub.firstname                   AS allocation_updated_by_firstname,
    uub.lastname                    AS allocation_updated_by_lastname,
    sa.order_id,
    sa.quantity_ordered,
    sa.item_status_id,
    ios.name                        AS item_status_name,
    ios.code                        AS item_status_code,
    sa.item_status_date,
    sa.sku_id,
    s.sku,
    s.barcode,
    s.country_code,
    s.size_label,
    p.id                            AS product_id,
    p.name                          AS product_name,
    p.brand,
    p.category,
    sa.packaging_material_id,
    COALESCE(pkg.code,  pm.code)    AS packaging_material_code,
    COALESCE(pmb.material_snapshot_name, pkg.name, pm.name) AS packaging_material_name,
    COALESCE(pkg.color, pm.color)   AS packaging_material_color,
    COALESCE(pkg.size,  pm.size)    AS packaging_material_size,
    COALESCE(pkg.unit,  pm.unit)    AS packaging_material_unit,
    COALESCE(pkg.length_cm, pm.length_cm) AS packaging_material_length_cm,
    COALESCE(pkg.width_cm,  pm.width_cm)  AS packaging_material_width_cm,
    COALESCE(pkg.height_cm, pm.height_cm) AS packaging_material_height_cm,
    o.order_number,
    o.note                          AS order_note,
    o.order_type_id,
    ot.name                         AS order_type_name,
    o.order_status_id,
    os.name                         AS order_status_name,
    os.code                         AS order_status_code,
    o.created_by                    AS salesperson_id,
    u.firstname                     AS salesperson_firstname,
    u.lastname                      AS salesperson_lastname,
    br.batch_type,
    CASE WHEN br.batch_type = 'product' THEN
      jsonb_build_object(
        'product_batch_id',    pb.id,
        'lot_number',          pb.lot_number,
        'expiry_date',         pb.expiry_date,
        'manufacture_date',    pb.manufacture_date,
        'warehouse_inventory', COALESCE(wi_arr.wi_list, '[]'::jsonb)
      )
    END AS product_batch,
    CASE WHEN br.batch_type = 'packaging_material' THEN
      jsonb_build_object(
        'packaging_material_batch_id', pmb.id,
        'lot_number',                  pmb.lot_number,
        'expiry_date',                 pmb.expiry_date,
        'manufacture_date',            pmb.manufacture_date,
        'material_snapshot_name',      pmb.material_snapshot_name,
        'warehouse_inventory',         COALESCE(wi_arr.wi_list, '[]'::jsonb)
      )
    END AS packaging_material_batch
  FROM selected_allocations sa
  JOIN orders o                         ON sa.order_id = o.id
  JOIN users u                          ON o.created_by = u.id
  LEFT JOIN users ucb                   ON sa.created_by = ucb.id
  LEFT JOIN users uub                   ON sa.updated_by = uub.id
  LEFT JOIN inventory_allocation_status s_alloc_status
    ON sa.allocation_status_id = s_alloc_status.id
  LEFT JOIN order_status ios            ON ios.id = sa.item_status_id
  LEFT JOIN skus s                      ON sa.sku_id = s.id
  LEFT JOIN products p                  ON s.product_id = p.id
  LEFT JOIN packaging_materials pm      ON sa.packaging_material_id = pm.id
  LEFT JOIN batch_registry br           ON sa.batch_id = br.id
  LEFT JOIN product_batches pb
    ON br.batch_type = 'product'
    AND pb.id = br.product_batch_id
  LEFT JOIN packaging_material_batches pmb
    ON br.batch_type = 'packaging_material'
    AND pmb.id = br.packaging_material_batch_id
  LEFT JOIN packaging_material_suppliers pms
    ON pmb.packaging_material_supplier_id = pms.id
  LEFT JOIN packaging_materials pkg     ON pms.packaging_material_id = pkg.id
  LEFT JOIN order_types ot              ON o.order_type_id = ot.id
  LEFT JOIN order_status os             ON o.order_status_id = os.id
  LEFT JOIN warehouse_inventory_agg wi_arr ON wi_arr.batch_id = br.id
`;

// ─── Paginated Allocations ────────────────────────────────────────────────────

// Valid sort fields — raw DB columns since no sort map is registered for this domain.
// sortBy must be validated against this set before being interpolated into the query.
const INVENTORY_ALLOCATION_PAGINATED_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.inventoryAllocationSortMap)
);

// CTE-based paginated query — ORDER BY is appended by the repository after
// whitelist validation. Params are split: rawAllocParams first, outerParams after.
const INVENTORY_ALLOCATION_BASE_QUERY = (
  rawAllocWhereClause,
  outerWhereClause
) => `
  WITH raw_alloc AS (
    SELECT
      oi.order_id,
      ARRAY_AGG(DISTINCT ia.id)                             AS allocation_ids,
      COUNT(DISTINCT ia.id)                                 AS allocated_items,
      ARRAY_AGG(DISTINCT w.id)                              AS warehouse_ids,
      STRING_AGG(DISTINCT w.name, ', ' ORDER BY w.name)    AS warehouse_names,
      ARRAY_AGG(DISTINCT s.code)                            AS allocation_status_codes,
      MIN(ia.allocated_at)                                  AS allocated_at,
      MIN(ia.created_at)                                    AS allocated_created_at,
      STRING_AGG(DISTINCT s.name, ', ' ORDER BY s.name)    AS allocation_statuses
    FROM inventory_allocations ia
    JOIN order_items oi                ON oi.id = ia.order_item_id
    LEFT JOIN warehouses w             ON w.id = ia.warehouse_id
    LEFT JOIN inventory_allocation_status s ON s.id = ia.status_id
    WHERE ${rawAllocWhereClause}
    GROUP BY oi.order_id
  ),
  alloc_agg AS (
    SELECT *,
      CASE
        WHEN 'ALLOC_FAILED'     = ANY(allocation_status_codes)  THEN 'Failed'
        WHEN 'ALLOC_PARTIAL'    = ANY(allocation_status_codes)
          OR 'ALLOC_BACKORDERED' = ANY(allocation_status_codes) THEN 'Partially Allocated'
        WHEN 'ALLOC_FULFILLING' = ANY(allocation_status_codes)
          AND NOT ('ALLOC_FULFILLED' = ALL(allocation_status_codes)) THEN 'Fulfilling'
        WHEN 'ALLOC_PENDING'    = ALL(allocation_status_codes)  THEN 'Pending Allocation'
        WHEN 'ALLOC_CONFIRMED'  = ALL(allocation_status_codes)  THEN 'Allocation Confirmed'
        WHEN 'ALLOC_FULFILLED'  = ALL(allocation_status_codes)  THEN 'Fulfilled'
        WHEN 'ALLOC_RETURNED'   = ALL(allocation_status_codes)  THEN 'Allocation Returned'
        ELSE 'Unknown'
      END AS allocation_summary_status
    FROM raw_alloc
  ),
  item_counts AS (
    SELECT oi.order_id, COUNT(*) AS total_items
    FROM order_items oi
    GROUP BY oi.order_id
  )
  SELECT
    o.id                            AS order_id,
    o.order_number,
    ot.name                         AS order_type,
    ot.category                     AS order_category,
    os.name                         AS order_status_name,
    os.code                         AS order_status_code,
    c.firstname                     AS customer_firstname,
    c.lastname                      AS customer_lastname,
    pm.name                         AS payment_method,
    ps.name                         AS payment_status_name,
    ps.code                         AS payment_status_code,
    dm.method_name                  AS delivery_method,
    ic.total_items,
    aa.allocated_items,
    aa.allocated_at,
    aa.allocated_created_at,
    o.created_at,
    u1.firstname                    AS created_by_firstname,
    u1.lastname                     AS created_by_lastname,
    o.updated_at,
    u2.firstname                    AS updated_by_firstname,
    u2.lastname                     AS updated_by_lastname,
    aa.warehouse_ids,
    aa.allocation_ids,
    aa.warehouse_names,
    aa.allocation_status_codes,
    aa.allocation_statuses,
    aa.allocation_summary_status
  FROM alloc_agg aa
  JOIN orders o                       ON o.id = aa.order_id
  LEFT JOIN item_counts ic            ON ic.order_id = o.id
  LEFT JOIN sales_orders so           ON so.id = o.id
  LEFT JOIN customers c               ON c.id = so.customer_id
  LEFT JOIN payment_methods pm        ON pm.id = so.payment_method_id
  LEFT JOIN payment_status ps         ON ps.id = so.payment_status_id
  LEFT JOIN delivery_methods dm       ON dm.id = so.delivery_method_id
  LEFT JOIN order_types ot            ON ot.id = o.order_type_id
  LEFT JOIN order_status os           ON os.id = o.order_status_id
  LEFT JOIN users u1                  ON u1.id = o.created_by
  LEFT JOIN users u2                  ON u2.id = o.updated_by
  WHERE ${outerWhereClause}
`;

// ─── Allocations By Order ─────────────────────────────────────────────────────

// Base query — repository appends AND ia.id = ANY($2::uuid[]) when allocationIds provided.
// $1: order_id
const INVENTORY_ALLOCATION_BY_ORDER_BASE = `
  SELECT
    ia.id                             AS allocation_id,
    ia.order_item_id,
    ia.warehouse_id,
    ia.batch_id,
    ia.allocated_quantity
  FROM inventory_allocations ia
  JOIN order_items oi ON ia.order_item_id = oi.id
  WHERE oi.order_id = $1
`;

// ─── Allocation Statuses ──────────────────────────────────────────────────────

// Base query — repository appends AND ia.order_item_id = ANY($2::uuid[]) when orderItemIds provided.
// $1: order_id
const INVENTORY_ALLOCATION_STATUSES_BASE = `
  SELECT
    o.id                              AS order_id,
    ia.id                             AS allocation_id,
    ia.order_item_id,
    ia.status_id,
    ias.code                          AS allocation_status_code,
    ias.is_final
  FROM inventory_allocations ia
  JOIN order_items oi                 ON ia.order_item_id = oi.id
  JOIN orders o                       ON oi.order_id = o.id
  JOIN inventory_allocation_status ias ON ia.status_id = ias.id
  WHERE oi.order_id = $1
`;

// ─── SKU Active Allocations ───────────────────────────────────────────────────

// EXISTS check — returns 1 if the SKU has any allocation in an active status.
// $1: sku_id, $2: active_allocation_status_ids (UUID array)
const SKU_ACTIVE_ALLOCATIONS_QUERY = `
  SELECT 1
  FROM inventory_allocations ia
  JOIN order_items oi ON ia.order_item_id = oi.id
  WHERE oi.sku_id = $1
    AND ia.status_id = ANY($2::uuid[])
  LIMIT 1
`;

module.exports = {
  INVENTORY_ALLOCATION_INSERT_COLUMNS,
  INVENTORY_ALLOCATION_CONFLICT_COLUMNS,
  INVENTORY_ALLOCATION_UPDATE_STRATEGIES,
  INVENTORY_ALLOCATION_EXTRA_UPDATES,
  INVENTORY_ALLOCATION_UPDATE_STATUS_QUERY,
  INVENTORY_ALLOCATION_MISMATCHED_IDS_QUERY,
  INVENTORY_ALLOCATION_REVIEW_QUERY,
  INVENTORY_ALLOCATION_PAGINATED_SORT_WHITELIST,
  INVENTORY_ALLOCATION_BASE_QUERY,
  INVENTORY_ALLOCATION_BY_ORDER_BASE,
  INVENTORY_ALLOCATION_STATUSES_BASE,
  SKU_ACTIVE_ALLOCATIONS_QUERY,
};
