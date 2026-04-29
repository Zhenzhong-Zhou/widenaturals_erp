/**
 * @file packaging-material-batch-queries.js
 * @description SQL query constants and factory functions for
 * packaging-material-batch-repository.js.
 *
 * Exports:
 *  - PMB_INSERT_COLUMNS           — ordered column list for bulk insert
 *  - PMB_CONFLICT_COLUMNS         — upsert conflict target columns
 *  - PMB_UPDATE_STRATEGIES        — conflict update strategies
 *  - PMB_TABLE                    — aliased table name for paginated query
 *  - PMB_JOINS                    — join array for paginated query
 *  - PMB_SORT_WHITELIST           — valid sort fields for paginated query
 *  - buildPmbPaginatedQuery        — factory for paginated list query
 *  - PMB_GET_BY_ID_QUERY          — fetch single batch by id with status
 *  - PMB_GET_DETAILS_BY_ID_QUERY  — full detail fetch with material and supplier joins
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertPackagingMaterialBatchesBulk row map.
const PMB_INSERT_COLUMNS = [
  'packaging_material_supplier_id',
  'lot_number',
  'material_snapshot_name',
  'received_label_name',
  'quantity',
  'unit',
  'manufacture_date',
  'expiry_date',
  'unit_cost',
  'currency',
  'exchange_rate',
  'total_cost',
  'status_id',
  'received_at',
  'received_by',
  'created_by',
  'updated_at',
  'updated_by',
];

// Conflict target: a batch is considered duplicate when both match.
const PMB_CONFLICT_COLUMNS = ['packaging_material_supplier_id', 'lot_number'];

const PMB_UPDATE_STRATEGIES = {
  material_snapshot_name: 'overwrite',
  received_label_name: 'overwrite',
  quantity: 'overwrite',
  unit_cost: 'overwrite',
  exchange_rate: 'overwrite',
  total_cost: 'overwrite',
  status_id: 'overwrite',
  status_date: 'overwrite',
  updated_at: 'overwrite',
};

// ─── Paginated List ───────────────────────────────────────────────────────────

const PMB_TABLE = 'packaging_material_batches pmb';

const PMB_JOINS = [
  'JOIN  packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id',
  'JOIN  packaging_materials          pm  ON pms.packaging_material_id           = pm.id',
  'JOIN  suppliers                    s   ON pms.supplier_id                     = s.id',
  'JOIN  batch_status                 bs  ON bs.id                               = pmb.status_id',
  'LEFT JOIN users rb ON rb.id = pmb.received_by',
  'LEFT JOIN users cb ON cb.id = pmb.created_by',
  'LEFT JOIN users ub ON ub.id = pmb.updated_by',
];

const _PMB_JOINS_SQL = PMB_JOINS.join('\n  ');

const PMB_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.packagingMaterialBatchSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPackagingMaterialBatchFilter.
 * @returns {string}
 */
const buildPmbPaginatedQuery = (whereClause) => `
  SELECT
    pmb.id,
    pmb.lot_number,
    pmb.quantity,
    pmb.unit,
    pmb.manufacture_date,
    pmb.expiry_date,
    pmb.received_at,
    pmb.received_by               AS received_by_id,
    rb.firstname                  AS received_by_firstname,
    rb.lastname                   AS received_by_lastname,
    pmb.material_snapshot_name,
    pmb.received_label_name,
    pmb.unit_cost,
    pmb.currency,
    pmb.exchange_rate,
    pmb.total_cost,
    pmb.status_id,
    bs.name                       AS status_name,
    pmb.status_date,
    pm.id                         AS packaging_material_id,
    pm.code                       AS packaging_material_code,
    pm.category                   AS packaging_material_category,
    s.id                          AS supplier_id,
    s.name                        AS supplier_name,
    pms.is_preferred,
    pms.lead_time_days,
    pmb.created_at,
    pmb.created_by                AS created_by_id,
    cb.firstname                  AS created_by_firstname,
    cb.lastname                   AS created_by_lastname,
    pmb.updated_at,
    pmb.updated_by                AS updated_by_id,
    ub.firstname                  AS updated_by_firstname,
    ub.lastname                   AS updated_by_lastname
  FROM ${PMB_TABLE}
  ${_PMB_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Single Record ────────────────────────────────────────────────────────────

// Minimal projection with status and batch registry link.
// $1: batch_id (UUID)
const PMB_GET_BY_ID_QUERY = `
  SELECT
    pmb.id,
    pmb.packaging_material_supplier_id,
    pmb.lot_number,
    pmb.material_snapshot_name,
    pmb.received_label_name,
    pmb.quantity,
    pmb.unit,
    pmb.manufacture_date,
    pmb.expiry_date,
    pmb.unit_cost,
    pmb.currency,
    pmb.exchange_rate,
    pmb.total_cost,
    pmb.received_at,
    pmb.received_by,
    pmb.notes,
    pmb.status_id,
    bs.name                       AS status_name,
    pmb.status_date,
    br.id                         AS batch_registry_id
  FROM packaging_material_batches pmb
  JOIN batch_status bs            ON bs.id  = pmb.status_id
  LEFT JOIN batch_registry br     ON br.packaging_material_batch_id = pmb.id
  WHERE pmb.id = $1
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// Full detail projection including material, supplier, and received_by user.
// $1: batch_id (UUID)
const PMB_GET_DETAILS_BY_ID_QUERY = `
  SELECT
    pmb.id,
    pmb.material_snapshot_name,
    pmb.received_label_name,
    pmb.lot_number,
    pmb.quantity,
    pmb.unit,
    pmb.manufacture_date,
    pmb.expiry_date,
    pmb.unit_cost,
    pmb.currency,
    pmb.total_cost,
    pmb.notes,
    pmb.received_at,
    pmb.status_date,
    pmb.status_id                 AS batch_status_id,
    bs.name                       AS batch_status_name,
    pm.id                         AS material_id,
    pm.name                       AS material_name,
    pm.code                       AS material_code,
    pm.category,
    pm.status_id                  AS material_status_id,
    st.name                       AS material_status_name,
    s.id                          AS supplier_id,
    s.name                        AS supplier_name,
    pms.is_preferred,
    pms.lead_time_days,
    ru.id                         AS received_by_id,
    ru.firstname                  AS received_by_firstname,
    ru.lastname                   AS received_by_lastname
  FROM packaging_material_batches pmb
  JOIN  packaging_material_suppliers pms ON pmb.packaging_material_supplier_id = pms.id
  JOIN  packaging_materials          pm  ON pms.packaging_material_id           = pm.id
  JOIN  suppliers                    s   ON pms.supplier_id                     = s.id
  LEFT JOIN batch_status bs             ON pmb.status_id  = bs.id
  LEFT JOIN status st                   ON pm.status_id   = st.id
  LEFT JOIN users ru                    ON pmb.received_by = ru.id
  WHERE pmb.id = $1
`;

module.exports = {
  PMB_INSERT_COLUMNS,
  PMB_CONFLICT_COLUMNS,
  PMB_UPDATE_STRATEGIES,
  PMB_TABLE,
  PMB_JOINS,
  PMB_SORT_WHITELIST,
  buildPmbPaginatedQuery,
  PMB_GET_BY_ID_QUERY,
  PMB_GET_DETAILS_BY_ID_QUERY,
};
