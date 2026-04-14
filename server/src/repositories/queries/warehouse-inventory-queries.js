/**
 * @file warehouse-inventory-queries.js
 * @description
 * Static query parts and SQL builder for the warehouse inventory domain.
 *
 * Exports the base table alias, join array, sort whitelist, paginated
 * SELECT builder, insert/upsert constants, and update queries used by
 * the warehouse inventory repository. All exports are module-level
 * constants — built once on load, never mutated at runtime.
 *
 * Exports:
 *  - WAREHOUSE_INVENTORY_TABLE
 *  - WAREHOUSE_INVENTORY_JOINS
 *  - WAREHOUSE_INVENTORY_SORT_WHITELIST
 *  - buildWarehouseInventoryPaginatedQuery
 *  - WAREHOUSE_INVENTORY_INSERT_COLUMNS
 *  - WAREHOUSE_INVENTORY_CONFLICT_COLUMNS
 *  - WAREHOUSE_INVENTORY_UPDATE_STRATEGIES
 *  - UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY
 *  - UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY
 *  - UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY
 *  - UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY
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
  reserved_quantity:  'overwrite',
  warehouse_fee:      'overwrite',
  inbound_date:       'overwrite',
  status_id:          'overwrite',
  status_date:        'overwrite',
  updated_at:         'overwrite',
  updated_by:         'overwrite',
};

// ── Update queries ──────────────────────────────────────────────────

const UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY = `
  UPDATE warehouse_inventory
  SET warehouse_quantity = $1,
      reserved_quantity  = $2,
      last_movement_at   = NOW(),
      updated_at         = NOW(),
      updated_by         = $3
  WHERE id = $4
    AND warehouse_id = $5
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

module.exports = {
  WAREHOUSE_INVENTORY_TABLE,
  WAREHOUSE_INVENTORY_JOINS,
  WAREHOUSE_INVENTORY_SORT_WHITELIST,
  buildWarehouseInventoryPaginatedQuery,
  WAREHOUSE_INVENTORY_INSERT_COLUMNS,
  WAREHOUSE_INVENTORY_CONFLICT_COLUMNS,
  WAREHOUSE_INVENTORY_UPDATE_STRATEGIES,
  UPDATE_WAREHOUSE_INVENTORY_QUANTITY_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_STATUS_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_OUTBOUND_QUERY,
  UPDATE_WAREHOUSE_INVENTORY_METADATA_QUERY,
};
