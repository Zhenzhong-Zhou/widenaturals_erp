/**
 * @file address-queries.js
 * @description SQL query constants, join clauses, and query factory functions
 * for address-repository.js.
 *
 * Constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause string from buildAddressFilter
 * and return a complete query string — SQL construction stays here so the
 * repository layer only handles execution.
 *
 * Exports:
 *  - ADDRESS_INSERT_COLUMNS       — ordered column list for upsert builds
 *  - ADDRESS_UPDATE_STRATEGIES    — overwrite strategy map for conflict resolution
 *  - ADDRESS_CONFLICT_COLUMNS     — upsert conflict target columns
 *  - ADDRESS_SORT_WHITELIST       — validated sort field set for query builder
 *  - ADDRESS_TABLE_NAME           — aliased table name passed to paginateQuery
 *  - ADDRESS_BASE_JOINS           — join clause array passed to paginateQuery
 *  - ADDRESS_ENRICHED_JOINS       — join clause array for enriched bulk fetch
 *  - ADDRESS_ENRICHED_QUERY       — static bulk fetch by id array
 *  - buildAddressBaseQuery        — factory for paginated list/detail query
 *  - buildAddressLookupQuery      — factory for lightweight dropdown lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Full column list in insert order. Order must match the values array passed
// to the upsert builder — do not reorder without updating the call site.
const ADDRESS_INSERT_COLUMNS = [
  'customer_id',
  'full_name',
  'phone',
  'email',
  'label',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'region',
  'note',
  'address_hash',
  'updated_at',
  'created_by',
  'updated_by',
];

// Subset of insert columns overwritten on conflict.
// Excludes immutable fields: customer_id, address_hash, created_by.
// Private — only used to build ADDRESS_UPDATE_STRATEGIES below.
const _ADDRESS_UPDATE_COLUMNS = [
  'full_name',
  'phone',
  'email',
  'label',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'region',
  'note',
  'address_hash',
  'updated_at',
  'updated_by',
];

// All mutable columns use overwrite strategy on conflict.
const ADDRESS_UPDATE_STRATEGIES = Object.fromEntries(
  _ADDRESS_UPDATE_COLUMNS.map((col) => [col, 'overwrite'])
);

// Conflict target: a record is considered duplicate when both match.
const ADDRESS_CONFLICT_COLUMNS = ['customer_id', 'address_hash'];

// ─── Pagination / Sorting ─────────────────────────────────────────────────────

// Whitelist of validated DB column names the query builder may sort by.
// Derived from sort-field-mapping to keep sort validation in one place.
const ADDRESS_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.addressSortMap)
);

// ─── List / Detail Query ──────────────────────────────────────────────────────

// Passed to paginateQuery as tableName so it can build the COUNT query independently.
const ADDRESS_TABLE_NAME = 'addresses a';

// u1 = created_by user, u2 = updated_by user, c = owning customer.
// Exported as an array so paginateQuery can receive it as joins — also
// pre-joined below as a private string for use inside buildAddressBaseQuery.
const ADDRESS_BASE_JOINS = [
  'LEFT JOIN users u1    ON a.created_by  = u1.id',
  'LEFT JOIN users u2    ON a.updated_by  = u2.id',
  'LEFT JOIN customers c ON a.customer_id = c.id',
];

// Resolved once at module load — reused inside buildAddressBaseQuery
// to avoid re-running .join() on every call.
const _ADDRESS_BASE_JOINS_SQL = ADDRESS_BASE_JOINS.join('\n  ');

/**
 * Builds the paginated list/detail query with a caller-supplied WHERE clause.
 *
 * The WHERE clause is a parameterised string produced by buildAddressFilter
 * (e.g. "a.customer_id = $1 AND a.city = $2") — never raw user input.
 *
 * @param {string} whereClause - Parameterised WHERE predicate (no leading WHERE keyword).
 * @returns {string} Complete SELECT query string ready for execution.
 */
const buildAddressBaseQuery = (whereClause) => `
  SELECT
    a.id,
    a.customer_id,
    a.label,
    a.full_name        AS recipient_name,
    a.phone,
    a.email,
    a.address_line1,
    a.address_line2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
    a.region,
    a.note,
    a.created_at,
    a.updated_at,
    u1.firstname       AS created_by_firstname,
    u1.lastname        AS created_by_lastname,
    u2.firstname       AS updated_by_firstname,
    u2.lastname        AS updated_by_lastname,
    c.firstname        AS customer_firstname,
    c.lastname         AS customer_lastname,
    c.customer_type    AS customer_type,
    c.company_name     AS customer_company_name,
    c.email            AS customer_email
  FROM ${ADDRESS_TABLE_NAME}
  ${_ADDRESS_BASE_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Enriched Bulk Fetch ──────────────────────────────────────────────────────

// Separate from buildAddressBaseQuery because this query uses different join
// aliases (cu/uu vs u1/u2) and includes customer_phone_number.
// cu = created_by user, uu = updated_by user, c = owning customer.
const ADDRESS_ENRICHED_JOINS = [
  'LEFT JOIN customers c  ON c.id  = a.customer_id',
  'LEFT JOIN users cu     ON cu.id = a.created_by',
  'LEFT JOIN users uu     ON uu.id = a.updated_by',
];

// Resolved once at module load — reused inside ADDRESS_ENRICHED_QUERY.
const _ADDRESS_ENRICHED_JOINS_SQL = ADDRESS_ENRICHED_JOINS.join('\n  ');

// Static query — WHERE predicate is always a.id = ANY($1).
// $1 must be an integer array.
const ADDRESS_ENRICHED_QUERY = `
  SELECT
    a.id,
    a.customer_id,
    a.full_name        AS recipient_name,
    a.phone,
    a.email,
    a.label,
    a.address_line1,
    a.address_line2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
    a.region,
    a.note,
    a.created_at,
    a.updated_at,
    cu.firstname       AS created_by_firstname,
    cu.lastname        AS created_by_lastname,
    uu.firstname       AS updated_by_firstname,
    uu.lastname        AS updated_by_lastname,
    c.firstname        AS customer_firstname,
    c.lastname         AS customer_lastname,
    c.customer_type    AS customer_type,
    c.company_name     AS customer_company_name,
    c.email            AS customer_email,
    c.phone_number     AS customer_phone_number
  FROM addresses a
  ${_ADDRESS_ENRICHED_JOINS_SQL}
  WHERE a.id = ANY($1)
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

/**
 * Builds the lightweight dropdown lookup query with a caller-supplied WHERE clause.
 *
 * A factory is required here because the WHERE clause is dynamic — when
 * includeUnassigned is true, buildAddressFilter appends an OR customer_id IS NULL
 * clause that cannot be represented as a static parameterised query.
 *
 * Intentionally omits audit and contact fields to keep the payload minimal.
 *
 * @param {string} whereClause - Parameterised WHERE predicate (no leading WHERE keyword).
 * @returns {string} Complete SELECT query string ready for execution.
 */
const buildAddressLookupQuery = (whereClause) => `
  SELECT
    a.id,
    a.full_name AS recipient_name,
    a.label,
    a.address_line1,
    a.city,
    a.state,
    a.postal_code,
    a.country
  FROM addresses a
  WHERE ${whereClause}
  ORDER BY a.created_at DESC
`;

module.exports = {
  ADDRESS_INSERT_COLUMNS,
  ADDRESS_UPDATE_STRATEGIES,
  ADDRESS_CONFLICT_COLUMNS,
  ADDRESS_SORT_WHITELIST,
  ADDRESS_TABLE_NAME,
  ADDRESS_BASE_JOINS,
  ADDRESS_ENRICHED_JOINS,
  ADDRESS_ENRICHED_QUERY,
  buildAddressBaseQuery,
  buildAddressLookupQuery,
};
