/**
 * @file warehouse-queries.js
 * @description SQL query constants and factory functions for warehouse-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - TABLE_NAME                    — aliased table name passed to paginateQuery
 *  - JOINS                         — join array shared across queries
 *  - SELECT_FIELDS                 — select fields for lookup query
 *  - WAREHOUSE_SORT_WHITELIST      — valid sort fields for paginated list query
 *  - WAREHOUSE_ADDITIONAL_SORTS    — deterministic tie-break sort columns
 *  - buildWarehousePaginatedQuery  — factory for paginated list query
 *  - GET_WAREHOUSE_BY_ID_QUERY     — full detail fetch by id
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Table ────────────────────────────────────────────────────────────────────

const TABLE_NAME = 'warehouses w';

// ─── Joins ────────────────────────────────────────────────────────────────────

const JOINS = [
  'JOIN      locations       l   ON l.id   = w.location_id',
  'LEFT JOIN warehouse_types wt  ON wt.id  = w.type_id',
  'LEFT JOIN status          st  ON st.id  = w.status_id',
  'LEFT JOIN users           cu  ON cu.id  = w.created_by',
  'LEFT JOIN users           uu  ON uu.id  = w.updated_by',
];

const _JOINS_SQL = JOINS.join('\n  ');

const _DETAIL_JOINS_SQL = [
  ...JOINS,
  'LEFT JOIN location_types  lt  ON lt.id  = l.location_type_id',
].join('\n  ');

// ─── Lookup Select Fields ─────────────────────────────────────────────────────

// Lightweight projection for dropdown use — no audit fields.
const SELECT_FIELDS = [
  'w.id                AS warehouse_id',
  'w.name              AS warehouse_name',
  'w.code              AS warehouse_code',
  'w.location_id',
  'l.name              AS location_name',
  'wt.name             AS warehouse_type_name',
  'w.is_archived',
  'st.name             AS status_name',
];

// ─── Sort ─────────────────────────────────────────────────────────────────────

const WAREHOUSE_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.warehouseSortMap)
);

// Deterministic tie-breaking applied after the primary sort.
const WAREHOUSE_ADDITIONAL_SORTS = [
  { column: 'l.name',       direction: 'ASC'  },
  { column: 'w.code',       direction: 'ASC'  },
  { column: 'w.created_at', direction: 'DESC' },
];

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildWarehouseFilter.
 * @returns {string}
 */
const buildWarehousePaginatedQuery = (whereClause) => `
  SELECT
    w.id,
    w.name                  AS warehouse_name,
    w.code                  AS warehouse_code,
    w.location_id,
    l.name                  AS location_name,
    wt.id                   AS warehouse_type_id,
    wt.name                 AS warehouse_type_name,
    w.status_id,
    st.name                 AS status_name,
    w.status_date,
    w.created_at,
    w.created_by,
    cu.firstname            AS created_by_firstname,
    cu.lastname             AS created_by_lastname,
    w.updated_at,
    w.updated_by,
    uu.firstname            AS updated_by_firstname,
    uu.lastname             AS updated_by_lastname
  FROM ${TABLE_NAME}
  ${_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// $1: warehouse id (UUID)
const GET_WAREHOUSE_BY_ID_QUERY = `
  SELECT
    w.id,
    w.name                  AS warehouse_name,
    w.code                  AS warehouse_code,
    w.storage_capacity,
    w.default_fee,
    w.is_archived,
    w.notes,
    w.location_id,
    l.name                  AS location_name,
    l.address_line1,
    l.address_line2,
    l.city,
    l.province_or_state,
    l.postal_code,
    l.country,
    lt.id                   AS location_type_id,
    lt.name                 AS location_type_name,
    wt.id                   AS warehouse_type_id,
    wt.name                 AS warehouse_type_name,
    w.status_id,
    st.name                 AS status_name,
    w.status_date,
    w.created_at,
    w.created_by,
    cu.firstname            AS created_by_firstname,
    cu.lastname             AS created_by_lastname,
    w.updated_at,
    w.updated_by,
    uu.firstname            AS updated_by_firstname,
    uu.lastname             AS updated_by_lastname
  FROM ${TABLE_NAME}
  ${_JOINS_SQL}
  WHERE w.id = $1
`;

module.exports = {
  TABLE_NAME,
  JOINS,
  SELECT_FIELDS,
  WAREHOUSE_SORT_WHITELIST,
  WAREHOUSE_ADDITIONAL_SORTS,
  buildWarehousePaginatedQuery,
  GET_WAREHOUSE_BY_ID_QUERY,
};
