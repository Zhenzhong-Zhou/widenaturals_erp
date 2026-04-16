/**
 * @file warehouse-inventory-queries.js
 * @description
 * Static query parts and SQL builder for the warehouse inventory domain.
 *
 * Exports the base table alias, join array, sort whitelist, paginated
 * SELECT builder, insert/upsert constants, update queries, and snapshot
 * queries used by the warehouse inventory repository. All exports are
 * module-level constants — built once on load, never mutated at runtime.
 *
 * Exports:
 *
 * ─── Paginated Query ──────────────────────────────────────────────────────────
 *  - WAREHOUSE_INVENTORY_TABLE                      — primary table alias
 *  - WAREHOUSE_INVENTORY_JOINS                      — ordered JOIN clauses for paginated query
 *  - WAREHOUSE_INVENTORY_SORT_WHITELIST             — allowed sort column values
 *  - buildWarehouseInventoryPaginatedQuery          — paginated SELECT builder
 *
 * ─── Insert / Upsert ──────────────────────────────────────────────────────────
 *  - WAREHOUSE_INVENTORY_INSERT_COLUMNS             — ordered column list for bulk insert
 *  - WAREHOUSE_INVENTORY_CONFLICT_COLUMNS           — conflict target for upsert
 *  - WAREHOUSE_INVENTORY_UPDATE_STRATEGIES          — conflict update strategies
 *
 * ─── Update Queries ───────────────────────────────────────────────────────────
 *  - UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY      — update warehouse and reserved quantities and status
 *  - UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY        — update inventory status
 *  - UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY      — record outbound and zero reserved quantity
 *  - UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY      — update inbound date and warehouse fee
 *
 * ─── Fetch / Existence Queries ────────────────────────────────────────────────
 *  - FETCH_WAREHOUSE_INVENTORY_STATE_QUERY          — fetch quantity and status for a set of inventory IDs
 *  - FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY     — check which batch IDs already have inventory records
 *  - WAREHOUSE_INVENTORY_DETAIL_QUERY               — full detail fetch for a single inventory record
 *
 * ─── Quantity Snapshot ────────────────────────────────────────────────────────
 *  - GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY       — fetch quantity snapshot for (warehouse, batch) key pairs
 *
 * ─── Batch Allocation ─────────────────────────────────────────────────────────
 *  - ALLOCATABLE_BATCHES_SORT                       — whitelisted ORDER BY expressions keyed by strategy
 *  - buildAllocatableBatchesQuery                   — allocatable batch SELECT builder
 *
 * ─── Inventory Existence Check ────────────────────────────────────────────────
 *  - SKU_HAS_INVENTORY_QUERY                        — check whether a SKU has any warehouse inventory records
 *
 * ─── Summary Queries ──────────────────────────────────────────────────────────
 *  - WAREHOUSE_SUMMARY_QUERY                        — aggregate quantity and fee totals for a warehouse
 *  - WAREHOUSE_SUMMARY_BY_STATUS_QUERY              — quantity totals grouped by inventory status
 *  - WAREHOUSE_PRODUCT_SUMMARY_QUERY                — quantity totals grouped by SKU for product batches
 *  - WAREHOUSE_PACKAGING_SUMMARY_QUERY              — quantity totals grouped by packaging material
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ── Static query parts ──────────────────────────────────────────────

/** @type {string} Primary table alias used in all warehouse inventory queries. */
const WAREHOUSE_INVENTORY_TABLE = 'warehouse_inventory wi';

/**
 * Ordered JOIN clauses for the warehouse inventory paginated query.
 * Covers product batch, SKU, product, manufacturer, and packaging lineage.
 *
 * @type {string[]}
 */
const WAREHOUSE_INVENTORY_JOINS = [
  'JOIN batch_registry br                   ON br.id  = wi.batch_id',
  'JOIN inventory_status ist                ON ist.id = wi.status_id',
  'LEFT JOIN product_batches pb             ON pb.id  = br.product_batch_id',
  'LEFT JOIN skus s                         ON s.id   = pb.sku_id',
  'LEFT JOIN products p                     ON p.id   = s.product_id',
  'LEFT JOIN manufacturers m                ON m.id   = pb.manufacturer_id',
  'LEFT JOIN packaging_material_batches pmb ON pmb.id = br.packaging_material_batch_id',
  'LEFT JOIN packaging_material_suppliers pms ON pms.id = pmb.packaging_material_supplier_id',
  'LEFT JOIN packaging_materials pm         ON pm.id  = pms.packaging_material_id',
  'LEFT JOIN suppliers sup                  ON sup.id = pms.supplier_id',
];

// Pre-joined for embedding directly into SQL templates.
const _WAREHOUSE_INVENTORY_JOINS_SQL = WAREHOUSE_INVENTORY_JOINS.join('\n  ');

/**
 * Allowed sort column values for warehouse inventory pagination.
 * Derived from the sort map to enforce whitelist at the query layer.
 *
 * @type {Set<string>}
 */
const WAREHOUSE_INVENTORY_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.warehouseInventorySortMap)
);

// ── Query builders ──────────────────────────────────────────────────

/**
 * Builds the paginated SELECT query for warehouse inventory records.
 *
 * Returns a SQL string with all columns needed for the inventory list view,
 * including computed `available_quantity` and full batch lineage via joins.
 * The caller supplies a pre-built WHERE clause string (with parameters
 * already substituted) via `paginateQuery`.
 *
 * @param {string} whereClause - SQL WHERE clause fragment (e.g. `"1=1 AND wi.warehouse_id = $1"`).
 * @returns {string} Complete SELECT … FROM … WHERE SQL string, without ORDER BY or LIMIT.
 */
const buildWarehouseInventoryPaginatedQuery = (whereClause) => `
  SELECT
    wi.id,
    wi.batch_id,
    wi.warehouse_quantity,
    wi.reserved_quantity,
    (wi.warehouse_quantity - wi.reserved_quantity) AS available_quantity,
    wi.warehouse_fee,
    wi.inbound_date,
    wi.outbound_date,
    wi.last_movement_at,
    wi.status_id,
    wi.status_date,
    ist.name                      AS status_name,
    br.batch_type,
    pb.id                         AS product_batch_id,
    pb.lot_number                 AS product_lot_number,
    pb.expiry_date                AS product_expiry_date,
    s.id                          AS sku_id,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code,
    s.market_region,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    m.id                          AS manufacturer_id,
    m.name                        AS manufacturer_name,
    pmb.id                        AS packaging_batch_id,
    pmb.lot_number                AS packaging_lot_number,
    pmb.received_label_name       AS packaging_display_name,
    pmb.expiry_date               AS packaging_expiry_date,
    pm.id                         AS packaging_material_id,
    pm.code                       AS packaging_material_code,
    sup.id                        AS supplier_id,
    sup.name                      AS supplier_name
  FROM ${WAREHOUSE_INVENTORY_TABLE}
  ${_WAREHOUSE_INVENTORY_JOINS_SQL}
  WHERE ${whereClause}
`;

// ── Insert / upsert ─────────────────────────────────────────────────

/** @type {string[]} */
const WAREHOUSE_INVENTORY_INSERT_COLUMNS = [
  'warehouse_id',
  'batch_id',
  'warehouse_quantity',
  'reserved_quantity',
  'warehouse_fee',
  'inbound_date',
  'status_id',
  'status_date',
  'created_by',
  'updated_at',
  'updated_by',
];

/** @type {string[]} */
const WAREHOUSE_INVENTORY_CONFLICT_COLUMNS = ['warehouse_id', 'batch_id'];

/** @type {Record<string, string>} */
const WAREHOUSE_INVENTORY_UPDATE_STRATEGIES = {
  warehouse_quantity: 'overwrite',
  reserved_quantity: 'overwrite',
  warehouse_fee: 'overwrite',
  inbound_date: 'overwrite',
  status_id: 'overwrite',
  status_date: 'overwrite',
  updated_at: 'overwrite',
  updated_by: 'overwrite',
};

// ── Update queries ──────────────────────────────────────────────────

// For allocation confirm — match by PK only, warehouse already scoped upstream
const UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY = `
  UPDATE warehouse_inventory
  SET warehouse_quantity = $1,
      reserved_quantity  = $2,
      status_id          = $3,
      last_movement_at   = NOW(),
      updated_at         = NOW(),
      updated_by         = $4
  WHERE id = $5
  RETURNING *
`;

// For adjust quantity API — warehouse_id guard stays as explicit ACL enforcement
const UPDATE_WAREHOUSE_INVENTORY_QUANTITY_WITH_WAREHOUSE_QUERY = `
  UPDATE warehouse_inventory
  SET warehouse_quantity = $1,
      reserved_quantity  = $2,
      status_id          = $3,
      last_movement_at   = NOW(),
      updated_at         = NOW(),
      updated_by         = $4
  WHERE id            = $5
    AND warehouse_id  = $6
  RETURNING *
`;

const UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY = `
  UPDATE warehouse_inventory
  SET status_id   = $1,
      status_date = NOW(),
      updated_at  = NOW(),
      updated_by  = $2
  WHERE id = $3
    AND warehouse_id = $4
  RETURNING *
`;

const UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY = `
  UPDATE warehouse_inventory
  SET outbound_date      = $1,
      warehouse_quantity = $2,
      reserved_quantity  = 0,
      last_movement_at   = NOW(),
      updated_at         = NOW(),
      updated_by         = $3
  WHERE id = $4
    AND warehouse_id = $5
  RETURNING *
`;

const UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY = `
  UPDATE warehouse_inventory
  SET inbound_date  = COALESCE($1, inbound_date),
      warehouse_fee = COALESCE($2, warehouse_fee),
      updated_at    = NOW(),
      updated_by    = $3
  WHERE id = $4
    AND warehouse_id = $5
  RETURNING *
`;

const FETCH_WAREHOUSE_INVENTORY_STATE_QUERY = `
  SELECT id, warehouse_quantity, reserved_quantity, status_id
  FROM warehouse_inventory
  WHERE id = ANY($1::uuid[])
    AND warehouse_id = $2
`;

const FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY = `
  SELECT batch_id
  FROM warehouse_inventory
  WHERE warehouse_id = $1
    AND batch_id = ANY($2::uuid[])
`;

// ── Detail ──────────────────────────────────────────────────────────

const WAREHOUSE_INVENTORY_DETAIL_QUERY = `
  SELECT
    wi.id,
    wi.batch_id,
    wi.warehouse_quantity,
    wi.reserved_quantity,
    (wi.warehouse_quantity - wi.reserved_quantity) AS available_quantity,
    wi.warehouse_fee,
    wi.inbound_date,
    wi.outbound_date,
    wi.last_movement_at,
    wi.status_id,
    wi.status_date,
    ist.name                      AS status_name,
    br.batch_type,
    br.registered_at,
    br.note                       AS batch_note,
    pb.id                         AS product_batch_id,
    pb.lot_number                 AS product_lot_number,
    pb.expiry_date                AS product_expiry_date,
    pb.manufacture_date           AS product_manufacture_date,
    pb.initial_quantity           AS product_initial_quantity,
    pb.notes                      AS product_batch_notes,
    s.id                          AS sku_id,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code,
    s.market_region,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.category,
    p.series,
    m.id                          AS manufacturer_id,
    m.name                        AS manufacturer_name,
    pmb.id                        AS packaging_batch_id,
    pmb.lot_number                AS packaging_lot_number,
    pmb.received_label_name       AS packaging_display_name,
    pmb.expiry_date               AS packaging_expiry_date,
    pmb.quantity                  AS packaging_initial_quantity,
    pmb.unit                      AS packaging_unit,
    pm.id                         AS packaging_material_id,
    pm.code                       AS packaging_material_code,
    pm.name                       AS packaging_material_name,
    pm.category                   AS packaging_material_category,
    sup.id                        AS supplier_id,
    sup.name                      AS supplier_name,
    wi.created_by,
    wi.created_at,
    wi.updated_by,
    wi.updated_at,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM warehouse_inventory wi
  JOIN batch_registry br                   ON br.id  = wi.batch_id
  JOIN inventory_status ist                ON ist.id = wi.status_id
  LEFT JOIN product_batches pb             ON pb.id  = br.product_batch_id
  LEFT JOIN skus s                         ON s.id   = pb.sku_id
  LEFT JOIN products p                     ON p.id   = s.product_id
  LEFT JOIN manufacturers m                ON m.id   = pb.manufacturer_id
  LEFT JOIN packaging_material_batches pmb ON pmb.id = br.packaging_material_batch_id
  LEFT JOIN packaging_material_suppliers pms ON pms.id = pmb.packaging_material_supplier_id
  LEFT JOIN packaging_materials pm         ON pm.id  = pms.packaging_material_id
  LEFT JOIN suppliers sup                  ON sup.id = pms.supplier_id
  LEFT JOIN users cu                       ON cu.id  = wi.created_by
  LEFT JOIN users uu                       ON uu.id  = wi.updated_by
  WHERE wi.id = $1
    AND wi.warehouse_id = $2
`;

// ── Summary ─────────────────────────────────────────────────────────

const WAREHOUSE_SUMMARY_QUERY = `
  SELECT
    w.id                          AS warehouse_id,
    w.name                        AS warehouse_name,
    w.code                        AS warehouse_code,
    w.storage_capacity,
    w.default_fee,
    wt.name                       AS warehouse_type_name,
    COUNT(wi.id)                  AS total_batches,
    COUNT(DISTINCT CASE WHEN br.batch_type = 'product' THEN pb.sku_id END)
                                  AS total_product_skus,
    COUNT(DISTINCT CASE WHEN br.batch_type = 'packaging_material' THEN pms.packaging_material_id END)
                                  AS total_packaging_materials,
    COALESCE(SUM(wi.warehouse_quantity), 0)    AS total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0)     AS total_reserved,
    COALESCE(SUM(wi.warehouse_quantity - wi.reserved_quantity), 0)
                                  AS total_available,
    COALESCE(SUM(CASE WHEN br.batch_type = 'product' THEN wi.warehouse_quantity ELSE 0 END), 0)
                                  AS product_quantity,
    COALESCE(SUM(CASE WHEN br.batch_type = 'packaging_material' THEN wi.warehouse_quantity ELSE 0 END), 0)
                                  AS packaging_quantity,
    COUNT(CASE WHEN br.batch_type = 'product' THEN 1 END)
                                  AS product_batch_count,
    COUNT(CASE WHEN br.batch_type = 'packaging_material' THEN 1 END)
                                  AS packaging_batch_count
  FROM warehouses w
  LEFT JOIN warehouse_types wt    ON wt.id = w.type_id
  LEFT JOIN warehouse_inventory wi ON wi.warehouse_id = w.id
  LEFT JOIN batch_registry br     ON br.id = wi.batch_id
  LEFT JOIN product_batches pb    ON pb.id = br.product_batch_id
  LEFT JOIN packaging_material_batches pmb ON pmb.id = br.packaging_material_batch_id
  LEFT JOIN packaging_material_suppliers pms ON pms.id = pmb.packaging_material_supplier_id
  WHERE w.id = $1
  GROUP BY w.id, w.name, w.code, w.storage_capacity, w.default_fee, wt.name
`;

const WAREHOUSE_SUMMARY_BY_STATUS_QUERY = `
  SELECT
    ist.id                        AS status_id,
    ist.name                      AS status_name,
    COUNT(wi.id)                  AS batch_count,
    COALESCE(SUM(wi.warehouse_quantity), 0)    AS total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0)     AS total_reserved,
    COALESCE(SUM(wi.warehouse_quantity - wi.reserved_quantity), 0)
                                  AS total_available
  FROM warehouse_inventory wi
  JOIN inventory_status ist       ON ist.id = wi.status_id
  WHERE wi.warehouse_id = $1
  GROUP BY ist.id, ist.name
  ORDER BY total_quantity DESC
`;

// ── Item summary ────────────────────────────────────────────────────

const WAREHOUSE_PRODUCT_SUMMARY_QUERY = `
  SELECT
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    s.id                          AS sku_id,
    s.sku,
    s.size_label,
    s.country_code,
    s.market_region,
    COUNT(wi.id)                  AS batch_count,
    COALESCE(SUM(wi.warehouse_quantity), 0)    AS total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0)     AS total_reserved,
    COALESCE(SUM(wi.warehouse_quantity - wi.reserved_quantity), 0)
                                  AS total_available,
    MIN(pb.expiry_date)           AS earliest_expiry
  FROM warehouse_inventory wi
  JOIN batch_registry br          ON br.id = wi.batch_id
  JOIN product_batches pb         ON pb.id = br.product_batch_id
  JOIN skus s                     ON s.id  = pb.sku_id
  JOIN products p                 ON p.id  = s.product_id
  WHERE wi.warehouse_id = $1
    AND br.batch_type = 'product'
  GROUP BY p.id, p.name, p.brand, s.id, s.sku, s.size_label, s.country_code, s.market_region
  ORDER BY p.name ASC, s.sku ASC
`;

const WAREHOUSE_PACKAGING_SUMMARY_QUERY = `
  SELECT
    pm.id                         AS packaging_material_id,
    pm.code                       AS packaging_material_code,
    pm.name                       AS packaging_material_name,
    pm.category                   AS packaging_material_category,
    COUNT(wi.id)                  AS batch_count,
    COALESCE(SUM(wi.warehouse_quantity), 0)    AS total_quantity,
    COALESCE(SUM(wi.reserved_quantity), 0)     AS total_reserved,
    COALESCE(SUM(wi.warehouse_quantity - wi.reserved_quantity), 0)
                                  AS total_available,
    MIN(pmb.expiry_date)          AS earliest_expiry
  FROM warehouse_inventory wi
  JOIN batch_registry br          ON br.id = wi.batch_id
  JOIN packaging_material_batches pmb ON pmb.id = br.packaging_material_batch_id
  JOIN packaging_material_suppliers pms ON pms.id = pmb.packaging_material_supplier_id
  JOIN packaging_materials pm     ON pm.id = pms.packaging_material_id
  WHERE wi.warehouse_id = $1
    AND br.batch_type = 'packaging_material'
  GROUP BY pm.id, pm.code, pm.name, pm.category
  ORDER BY pm.name ASC
`;

// ─── Quantity Snapshot ────────────────────────────────────────────────────────

const GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY = `
  SELECT
    wi.id,
    wi.warehouse_id,
    wi.batch_id,
    wi.warehouse_quantity,
    wi.reserved_quantity,
    wi.status_id
  FROM warehouse_inventory wi
  JOIN unnest($1::uuid[], $2::uuid[]) AS keys(warehouse_id, batch_id)
    ON wi.warehouse_id = keys.warehouse_id
   AND wi.batch_id     = keys.batch_id
`;

// ─── Batch Allocation ─────────────────────────────────────────────────────────

const ALLOCATABLE_BATCHES_SORT = {
  fefo: 'COALESCE(pb.expiry_date, pmb.expiry_date) ASC NULLS LAST',
  fifo: 'wi.inbound_date ASC NULLS LAST',
};

const buildAllocatableBatchesQuery = (orderByClause) => `
  SELECT
    wi.id                                        AS warehouse_inventory_id,
    wi.batch_id,
    wi.warehouse_id,
    w.name                                       AS warehouse_name,
    wi.warehouse_quantity,
    wi.reserved_quantity,
    COALESCE(pb.expiry_date,  pmb.expiry_date)   AS expiry_date,
    COALESCE(pb.lot_number,   pmb.lot_number)    AS lot_number,
    wi.inbound_date,
    br.batch_type,
    pb.sku_id,
    pm.id                                        AS packaging_material_id
  FROM warehouse_inventory wi
  JOIN warehouses w                              ON w.id  = wi.warehouse_id
  JOIN batch_registry br                         ON br.id = wi.batch_id
  LEFT JOIN product_batches pb                   ON br.product_batch_id = pb.id
  LEFT JOIN packaging_material_batches pmb       ON br.packaging_material_batch_id = pmb.id
  LEFT JOIN packaging_material_suppliers pms     ON pmb.packaging_material_supplier_id = pms.id
  LEFT JOIN packaging_materials pm               ON pms.packaging_material_id = pm.id
  WHERE wi.warehouse_id       = $1
    AND wi.warehouse_quantity > 0
    AND wi.status_id          = $2
    AND (
      (pb.sku_id IS NOT NULL AND pb.sku_id = ANY($3::uuid[]))
      OR
      (pm.id IS NOT NULL     AND pm.id     = ANY($4::uuid[]))
    )
  ORDER BY ${orderByClause}
`;

// ─── Inventory Existence Check ────────────────────────────────────────────────

const SKU_HAS_INVENTORY_QUERY = `
  SELECT 1
  FROM warehouse_inventory wi
  JOIN batch_registry br ON br.id = wi.batch_id
  JOIN product_batches pb ON pb.id = br.product_batch_id
  WHERE pb.sku_id = $1
  LIMIT 1
`;

module.exports = {
  WAREHOUSE_INVENTORY_TABLE,
  WAREHOUSE_INVENTORY_JOINS,
  WAREHOUSE_INVENTORY_SORT_WHITELIST,
  buildWarehouseInventoryPaginatedQuery,
  WAREHOUSE_INVENTORY_INSERT_COLUMNS,
  WAREHOUSE_INVENTORY_CONFLICT_COLUMNS,
  WAREHOUSE_INVENTORY_UPDATE_STRATEGIES,
  UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_QUANTITY_WITH_WAREHOUSE_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY,
  FETCH_WAREHOUSE_INVENTORY_STATE_QUERY,
  FIND_EXISTING_INVENTORY_BY_BATCH_IDS_QUERY,
  WAREHOUSE_INVENTORY_DETAIL_QUERY,
  WAREHOUSE_SUMMARY_QUERY,
  WAREHOUSE_SUMMARY_BY_STATUS_QUERY,
  WAREHOUSE_PRODUCT_SUMMARY_QUERY,
  WAREHOUSE_PACKAGING_SUMMARY_QUERY,
  GET_WAREHOUSE_INVENTORY_QUANTITIES_QUERY,
  ALLOCATABLE_BATCHES_SORT,
  buildAllocatableBatchesQuery,
  SKU_HAS_INVENTORY_QUERY,
};
