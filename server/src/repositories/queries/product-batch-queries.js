/**
 * @file product-batch-queries.js
 * @description SQL query constants and factory functions for
 * product-batch-repository.js.
 *
 * Exports:
 *  - PB_INSERT_COLUMNS          — ordered column list for bulk insert
 *  - PB_CONFLICT_COLUMNS        — upsert conflict target columns
 *  - PB_UPDATE_STRATEGIES       — conflict update strategies
 *  - PB_TABLE                   — aliased table name for paginated query
 *  - PB_JOINS                   — join array for paginated query
 *  - PB_SORT_WHITELIST          — valid sort fields for paginated query
 *  - buildPbPaginatedQuery       — factory for paginated list query
 *  - PB_GET_BY_ID_QUERY         — fetch single batch by id with status
 *  - PB_GET_DETAILS_BY_ID_QUERY — full detail fetch with product and manufacturer joins
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertProductBatchesBulk row map.
const PB_INSERT_COLUMNS = [
  'lot_number',
  'sku_id',
  'manufacturer_id',
  'manufacture_date',
  'expiry_date',
  'received_at',
  'received_by',
  'initial_quantity',
  'notes',
  'status_id',
  'released_at',
  'released_by',
  'released_by_manufacturer_id',
  'created_by',
  'updated_at',
  'updated_by',
];

// Conflict target: a batch is considered duplicate when both match.
const PB_CONFLICT_COLUMNS = ['lot_number', 'sku_id'];

const PB_UPDATE_STRATEGIES = {
  manufacturer_id: 'preserve',
  received_at: 'preserve',
  notes: 'overwrite',
  status_id: 'overwrite',
  released_at: 'preserve',
  released_by: 'preserve',
  released_by_manufacturer_id: 'preserve',
  updated_at: 'overwrite',
};

// ─── Paginated List ───────────────────────────────────────────────────────────

const PB_TABLE = 'product_batches pb';

const PB_JOINS = [
  'JOIN      skus          sk ON sk.id = pb.sku_id',
  'JOIN      products      p  ON p.id  = sk.product_id',
  'LEFT JOIN manufacturers m  ON m.id  = pb.manufacturer_id',
  'JOIN      batch_status  bs ON bs.id = pb.status_id',
  'LEFT JOIN users         rb ON rb.id = pb.released_by',
  'LEFT JOIN users         cb ON cb.id = pb.created_by',
  'LEFT JOIN users         ub ON ub.id = pb.updated_by',
];

const _PB_JOINS_SQL = PB_JOINS.join('\n  ');

const PB_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.productBatchSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildProductBatchFilter.
 * @returns {string}
 */
const buildPbPaginatedQuery = (whereClause) => `
  SELECT
    pb.id,
    pb.lot_number,
    pb.sku_id,
    sk.sku                        AS sku_code,
    sk.size_label,
    sk.country_code,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.category,
    pb.manufacturer_id,
    m.name                        AS manufacturer_name,
    pb.manufacture_date,
    pb.expiry_date,
    pb.received_at,
    pb.initial_quantity,
    pb.status_id,
    bs.name                       AS status_name,
    pb.status_date,
    pb.released_at,
    pb.released_by                AS released_by_id,
    rb.firstname                  AS released_by_firstname,
    rb.lastname                   AS released_by_lastname,
    pb.created_at,
    pb.created_by                 AS created_by_id,
    cb.firstname                  AS created_by_firstname,
    cb.lastname                   AS created_by_lastname,
    pb.updated_at,
    pb.updated_by                 AS updated_by_id,
    ub.firstname                  AS updated_by_firstname,
    ub.lastname                   AS updated_by_lastname
  FROM ${PB_TABLE}
  ${_PB_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Single Record ────────────────────────────────────────────────────────────

// Minimal projection with status and batch registry link.
// $1: batch_id (UUID)
const PB_GET_BY_ID_QUERY = `
  SELECT
    pb.id,
    pb.lot_number,
    pb.sku_id,
    pb.manufacturer_id,
    pb.manufacture_date,
    pb.expiry_date,
    pb.received_at,
    pb.received_by,
    pb.initial_quantity,
    pb.notes,
    pb.status_id,
    bs.name                       AS status_name,
    pb.status_date,
    pb.released_at,
    pb.released_by,
    pb.released_by_manufacturer_id,
    br.id                         AS batch_registry_id
  FROM product_batches pb
  JOIN      batch_status bs ON bs.id = pb.status_id
  LEFT JOIN batch_registry br ON br.product_batch_id = pb.id
  WHERE pb.id = $1
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// Full detail projection including product, SKU, manufacturer, and user fields.
// $1: batch_id (UUID)
const PB_GET_DETAILS_BY_ID_QUERY = `
  SELECT
    pb.id,
    pb.lot_number,
    pb.initial_quantity,
    pb.manufacture_date,
    pb.expiry_date,
    pb.received_at,
    pb.released_at,
    pb.notes,
    pb.status_date,
    pb.status_id                  AS batch_status_id,
    bs.name                       AS batch_status_name,
    s.id                          AS sku_id,
    s.sku,
    s.barcode,
    s.size_label,
    s.market_region,
    s.status_id                   AS sku_status_id,
    ss.name                       AS sku_status_name,
    p.id                          AS product_id,
    p.name                        AS product_name,
    p.brand,
    p.category,
    p.status_id                   AS product_status_id,
    ps.name                       AS product_status_name,
    m.id                          AS manufacturer_id,
    m.name                        AS manufacturer_name,
    m.status_id                   AS manufacturer_status_id,
    ms.name                       AS manufacturer_status_name,
    ru.id                         AS received_by_id,
    ru.firstname                  AS received_by_firstname,
    ru.lastname                   AS received_by_lastname,
    rlu.id                        AS released_by_id,
    rlu.firstname                 AS released_by_firstname,
    rlu.lastname                  AS released_by_lastname
  FROM product_batches pb
  JOIN      skus         s   ON pb.sku_id          = s.id
  JOIN      products     p   ON s.product_id        = p.id
  JOIN      manufacturers m   ON pb.manufacturer_id  = m.id
  JOIN      batch_status  bs  ON pb.status_id        = bs.id
  LEFT JOIN status        ss  ON s.status_id         = ss.id
  LEFT JOIN status        ps  ON p.status_id         = ps.id
  LEFT JOIN status        ms  ON m.status_id         = ms.id
  LEFT JOIN users         ru  ON pb.received_by      = ru.id
  LEFT JOIN users         rlu ON pb.released_by      = rlu.id
  WHERE pb.id = $1
`;

module.exports = {
  PB_INSERT_COLUMNS,
  PB_CONFLICT_COLUMNS,
  PB_UPDATE_STRATEGIES,
  PB_TABLE,
  PB_JOINS,
  PB_SORT_WHITELIST,
  buildPbPaginatedQuery,
  PB_GET_BY_ID_QUERY,
  PB_GET_DETAILS_BY_ID_QUERY,
};
