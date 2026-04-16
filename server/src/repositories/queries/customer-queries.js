/**
 * @file customer-queries.js
 * @description SQL query constants and factory functions for customer-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - CUSTOMER_INSERT_COLUMNS           — ordered column list for bulk insert
 *  - CUSTOMER_UPDATE_STRATEGIES        — conflict update strategies
 *  - CUSTOMER_CONFLICT_COLUMNS         — upsert conflict target columns
 *  - CUSTOMER_ENRICHED_QUERY           — bulk fetch by id array with audit fields
 *  - CUSTOMER_PAGINATED_TABLE          — aliased table name for paginated query
 *  - CUSTOMER_PAGINATED_JOINS          — join array for paginated query
 *  - CUSTOMER_PAGINATED_SORT_WHITELIST — valid sort fields for paginated query
 *  - buildCustomerPaginatedQuery       — factory for paginated list query
 *  - CUSTOMER_LOOKUP_TABLE             — aliased table name for lookup query
 *  - CUSTOMER_LOOKUP_SORT_WHITELIST    — valid sort fields for lookup query
 *  - CUSTOMER_LOOKUP_ADDITIONAL_SORTS  — tie-break sort columns for lookup
 *  - buildCustomerLookupQuery          — factory for lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertCustomerRecords row map.
const CUSTOMER_INSERT_COLUMNS = [
  'firstname',
  'lastname',
  'email',
  'phone_number',
  'customer_type',
  'company_name',
  'status_id',
  'note',
  'updated_at',
  'created_by',
  'updated_by',
];

// Subset of insert columns overwritten on conflict.
// Excludes immutable fields: email, phone_number, created_by.
const _CUSTOMER_UPDATE_COLUMNS = [
  'firstname',
  'lastname',
  'company_name',
  'status_id',
  'note',
  'updated_at',
  'updated_by',
];

const CUSTOMER_UPDATE_STRATEGIES = Object.fromEntries(
  _CUSTOMER_UPDATE_COLUMNS.map((col) => [col, 'overwrite'])
);

// Conflict target: a customer is considered duplicate when either matches.
const CUSTOMER_CONFLICT_COLUMNS = ['email'];

// ─── Enriched Bulk Fetch ──────────────────────────────────────────────────────

// Bulk fetch by id array — $1 must be a UUID array.
const CUSTOMER_ENRICHED_QUERY = `
  SELECT
    c.id,
    c.firstname,
    c.lastname,
    c.email,
    c.phone_number,
    c.customer_type,
    c.company_name,
    c.note,
    c.status_id,
    s.name                        AS status_name,
    c.created_at,
    c.updated_at,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM customers c
  LEFT JOIN status s  ON s.id  = c.status_id
  LEFT JOIN users cu  ON cu.id = c.created_by
  LEFT JOIN users uu  ON uu.id = c.updated_by
  WHERE c.id = ANY($1)
`;

// ─── Paginated List ───────────────────────────────────────────────────────────

const CUSTOMER_PAGINATED_TABLE = 'customers c';

const CUSTOMER_PAGINATED_JOINS = [
  'INNER JOIN status s  ON c.status_id  = s.id',
  'LEFT JOIN  users u1  ON c.created_by = u1.id',
  'LEFT JOIN  users u2  ON c.updated_by = u2.id',
];

const _CUSTOMER_PAGINATED_JOINS_SQL = CUSTOMER_PAGINATED_JOINS.join('\n  ');

// Whitelist is built from the registered customerSortMap — includes all default
// natural sort columns via .flat() so array-valued entries are individually whitelisted
const CUSTOMER_PAGINATED_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.customerSortMap).flat()
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildCustomerFilter.
 * @returns {string}
 */
const buildCustomerPaginatedQuery = (whereClause) => `
  SELECT
    c.id,
    c.firstname,
    c.lastname,
    c.email,
    c.phone_number,
    c.customer_type,
    c.company_name,
    c.status_id,
    s.name                        AS status_name,
    c.status_date,
    EXISTS (
      SELECT 1 FROM addresses a WHERE a.customer_id = c.id
    )                             AS has_address,
    c.created_at,
    c.updated_at,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM ${CUSTOMER_PAGINATED_TABLE}
  ${_CUSTOMER_PAGINATED_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const CUSTOMER_LOOKUP_TABLE = 'customers c';

// Lightweight sort options for dropdown — no joins required.
const CUSTOMER_LOOKUP_SORT_WHITELIST = new Set([
  'c.firstname',
  'c.lastname',
  'c.created_at',
]);

// Deterministic tie-breaking after primary sort on firstname.
const CUSTOMER_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'c.lastname', direction: 'ASC' },
  { column: 'c.created_at', direction: 'DESC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildCustomerFilter.
 * @returns {string}
 */
const buildCustomerLookupQuery = (whereClause) => `
  SELECT
    c.id,
    c.firstname,
    c.lastname,
    c.customer_type,
    c.company_name,
    c.email,
    EXISTS (
      SELECT 1 FROM addresses a WHERE a.customer_id = c.id
    )                             AS has_address,
    c.status_id
  FROM ${CUSTOMER_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  CUSTOMER_INSERT_COLUMNS,
  CUSTOMER_UPDATE_STRATEGIES,
  CUSTOMER_CONFLICT_COLUMNS,
  CUSTOMER_ENRICHED_QUERY,
  CUSTOMER_PAGINATED_TABLE,
  CUSTOMER_PAGINATED_JOINS,
  CUSTOMER_PAGINATED_SORT_WHITELIST,
  buildCustomerPaginatedQuery,
  CUSTOMER_LOOKUP_TABLE,
  CUSTOMER_LOOKUP_SORT_WHITELIST,
  CUSTOMER_LOOKUP_ADDITIONAL_SORTS,
  buildCustomerLookupQuery,
};
