/**
 * @file batch-registry-queries.js
 * @description SQL query constants, join clauses, and query factory functions
 * for batch-registry-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder
 * and return a complete query string.
 *
 * Exports:
 *  - BATCH_REGISTRY_GET_BY_ID                  — minimal fetch by ID
 *  - BATCH_REGISTRY_LOOKUP_TABLE               — table name for lookup query
 *  - BATCH_REGISTRY_LOOKUP_JOINS               — join array for lookup query
 *  - BATCH_REGISTRY_LOOKUP_WHITELIST           — sort whitelist for lookup
 *  - buildBatchRegistryLookupQuery             — factory for lookup query
 *  - BATCH_REGISTRY_PAGINATED_TABLE            — table name for paginated query
 *  - BATCH_REGISTRY_PAGINATED_JOINS            — join array for paginated query
 *  - BATCH_REGISTRY_SORT_WHITELIST             — sort whitelist for paginated query
 *  - buildBatchRegistryPaginatedQuery          — factory for paginated query
 *  - BATCH_REGISTRY_INSERT_COLUMNS             — ordered column list for bulk insert
 *  - BATCH_REGISTRY_UPDATE_STRATEGIES          — conflict update strategies
 *  - BATCH_REGISTRY_CONFLICT_COLUMNS_PRODUCT   — conflict target for product batches
 *  - BATCH_REGISTRY_CONFLICT_COLUMNS_PACKAGING — conflict target for packaging batches
 *  - BATCH_REGISTRY_UPDATE_NOTE_QUERY          — update note by ID
 *  - BATCH_REGISTRY_DETAILS_QUERY              — full detail fetch with joins
 *  - VALIDATE_BATCH_REGISTRY_IDS_QUERY         — existence check for a set of batch IDs
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Single Record ────────────────────────────────────────────────────────────

// Minimal projection — used for existence checks and type resolution only.
const BATCH_REGISTRY_GET_BY_ID = `
  SELECT id, batch_type, note
  FROM batch_registry
  WHERE id = $1
  LIMIT 1
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const BATCH_REGISTRY_LOOKUP_TABLE = 'batch_registry br';

// Factory required — WHERE clause is dynamic from buildBatchRegistryInventoryScopeFilter.
const BATCH_REGISTRY_LOOKUP_JOINS = [
  'LEFT JOIN product_batches pb             ON br.product_batch_id = pb.id',
  'LEFT JOIN skus s                         ON pb.sku_id = s.id',
  'LEFT JOIN products p                     ON s.product_id = p.id',
  'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
];

const _BATCH_REGISTRY_LOOKUP_JOINS_SQL = BATCH_REGISTRY_LOOKUP_JOINS.join('\n  ');

// Only registered_at is sortable in the lookup — this is a narrow projection.
const BATCH_REGISTRY_LOOKUP_WHITELIST = new Set(['br.registered_at']);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildBatchRegistryInventoryScopeFilter.
 * @returns {string}
 */
const buildBatchRegistryLookupQuery = (whereClause) => `
  SELECT
    br.id                       AS batch_registry_id,
    br.batch_type,
    pb.id                       AS product_batch_id,
    p.name                      AS product_name,
    p.brand,
    s.sku,
    s.country_code,
    s.size_label,
    pb.lot_number               AS product_lot_number,
    pb.expiry_date              AS product_expiry_date,
    pmb.id                      AS packaging_material_batch_id,
    pmb.lot_number              AS material_lot_number,
    pmb.expiry_date             AS material_expiry_date,
    pmb.material_snapshot_name,
    pmb.received_label_name
  FROM ${BATCH_REGISTRY_LOOKUP_TABLE}
  ${_BATCH_REGISTRY_LOOKUP_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Paginated Query ──────────────────────────────────────────────────────────

const BATCH_REGISTRY_PAGINATED_TABLE = 'batch_registry br';

// Identity-level joins only — quantities, QA, and financial data excluded by design.
const BATCH_REGISTRY_PAGINATED_JOINS = [
  'LEFT JOIN users u_reg                    ON br.registered_by = u_reg.id',
  'LEFT JOIN product_batches pb             ON br.product_batch_id = pb.id',
  'LEFT JOIN batch_status bs_pb             ON pb.status_id = bs_pb.id',
  'LEFT JOIN skus s                         ON pb.sku_id = s.id',
  'LEFT JOIN products p                     ON s.product_id = p.id',
  'LEFT JOIN manufacturers m               ON pb.manufacturer_id = m.id',
  'LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id',
  'LEFT JOIN batch_status bs_pmb            ON pmb.status_id = bs_pmb.id',
  'LEFT JOIN packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id',
  'LEFT JOIN packaging_materials pm         ON pms.packaging_material_id = pm.id',
  'LEFT JOIN suppliers sup                  ON pms.supplier_id = sup.id',
];

const _BATCH_REGISTRY_PAGINATED_JOINS_SQL = BATCH_REGISTRY_PAGINATED_JOINS.join('\n  ');

const BATCH_REGISTRY_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.batchRegistrySortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildBatchRegistryFilter.
 * @returns {string}
 */
const buildBatchRegistryPaginatedQuery = (whereClause) => `
  SELECT
    br.id                       AS batch_registry_id,
    br.batch_type,
    br.registered_at,
    br.registered_by,
    u_reg.firstname             AS registered_by_firstname,
    u_reg.lastname              AS registered_by_lastname,
    br.note,
    pb.id                       AS product_batch_id,
    pb.lot_number               AS product_lot_number,
    pb.expiry_date              AS product_expiry_date,
    pb.status_id                AS product_batch_status_id,
    bs_pb.name                  AS product_batch_status_name,
    pb.status_date              AS product_batch_status_date,
    s.id                        AS sku_id,
    s.sku                       AS sku_code,
    p.id                        AS product_id,
    p.name                      AS product_name,
    m.id                        AS manufacturer_id,
    m.name                      AS manufacturer_name,
    pmb.id                      AS packaging_batch_id,
    pmb.lot_number              AS packaging_lot_number,
    pmb.received_label_name     AS packaging_display_name,
    pmb.expiry_date             AS packaging_expiry_date,
    pmb.status_id               AS packaging_batch_status_id,
    bs_pmb.name                 AS packaging_batch_status_name,
    pmb.status_date             AS packaging_batch_status_date,
    pm.id                       AS packaging_material_id,
    pm.code                     AS packaging_material_code,
    sup.id                      AS supplier_id,
    sup.name                    AS supplier_name
  FROM ${BATCH_REGISTRY_PAGINATED_TABLE}
  ${_BATCH_REGISTRY_PAGINATED_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Insert ───────────────────────────────────────────────────────────────────

// Order must match the values array in insertBatchRegistryBulk row map.
const BATCH_REGISTRY_INSERT_COLUMNS = [
  'batch_type',
  'product_batch_id',
  'packaging_material_batch_id',
  'registered_by',
  'updated_at',
  'updated_by',
  'note',
];

// On conflict, only note is overwritten — all other fields are immutable after insert.
const BATCH_REGISTRY_UPDATE_STRATEGIES = {
  note: 'overwrite',
};

// Conflict targets are separated by batch_type — each has its own unique constraint.
const BATCH_REGISTRY_CONFLICT_COLUMNS_PRODUCT    = ['product_batch_id'];
const BATCH_REGISTRY_CONFLICT_COLUMNS_PACKAGING  = ['packaging_material_batch_id'];

// ─── Update ───────────────────────────────────────────────────────────────────

// $1 = id, $2 = note, $3 = updatedBy
const BATCH_REGISTRY_UPDATE_NOTE_QUERY = `
  UPDATE batch_registry
  SET
    note       = $2,
    updated_by = $3,
    updated_at = NOW()
  WHERE id = $1
  RETURNING id
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

const BATCH_REGISTRY_DETAILS_QUERY = `
  SELECT
    br.id                   AS registry_id,
    br.batch_type,
    br.note,
    br.registered_at,
    br.updated_at,
    pb.id                   AS product_batch_id,
    pb.lot_number           AS product_lot_number,
    pb.expiry_date          AS product_expiry_date,
    pmb.id                  AS packaging_batch_id,
    pmb.lot_number          AS packaging_lot_number,
    pmb.expiry_date         AS packaging_expiry_date,
    ru.id                   AS registered_by_id,
    ru.firstname            AS registered_by_firstname,
    ru.lastname             AS registered_by_lastname
  FROM batch_registry br
  LEFT JOIN product_batches pb             ON br.product_batch_id = pb.id
  LEFT JOIN packaging_material_batches pmb ON br.packaging_material_batch_id = pmb.id
  LEFT JOIN users ru                       ON br.registered_by = ru.id
  WHERE br.id = $1
`;

const VALIDATE_BATCH_REGISTRY_IDS_QUERY = `
  SELECT id
  FROM batch_registry
  WHERE id = ANY($1::uuid[])
`;

module.exports = {
  BATCH_REGISTRY_GET_BY_ID,
  BATCH_REGISTRY_LOOKUP_TABLE,
  BATCH_REGISTRY_LOOKUP_JOINS,
  BATCH_REGISTRY_LOOKUP_WHITELIST,
  buildBatchRegistryLookupQuery,
  BATCH_REGISTRY_PAGINATED_TABLE,
  BATCH_REGISTRY_PAGINATED_JOINS,
  BATCH_REGISTRY_SORT_WHITELIST,
  buildBatchRegistryPaginatedQuery,
  BATCH_REGISTRY_INSERT_COLUMNS,
  BATCH_REGISTRY_UPDATE_STRATEGIES,
  BATCH_REGISTRY_CONFLICT_COLUMNS_PRODUCT,
  BATCH_REGISTRY_CONFLICT_COLUMNS_PACKAGING,
  BATCH_REGISTRY_UPDATE_NOTE_QUERY,
  BATCH_REGISTRY_DETAILS_QUERY,
  VALIDATE_BATCH_REGISTRY_IDS_QUERY,
};
