/**
 * @file role-queries.js
 * @description SQL query constants and factory functions for role-repository.js.
 *
 * Exports:
 *  - ROLE_GET_BY_ID_QUERY        — fetch single role by id
 *  - ROLE_RESOLVE_BY_NAME_QUERY  — fetch role id by name (case-insensitive)
 *  - ROLE_LOOKUP_TABLE           — aliased table name for lookup query
 *  - ROLE_LOOKUP_JOINS           — join array for lookup query
 *  - ROLE_LOOKUP_SORT_WHITELIST  — valid sort fields for lookup query
 *  - ROLE_LOOKUP_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildRoleLookupQuery        — factory for lookup query
 */

'use strict';

// ─── Single Record ────────────────────────────────────────────────────────────

// $1: role_id (UUID)
const ROLE_GET_BY_ID_QUERY = `
  SELECT
    id,
    name,
    role_group,
    parent_role_id,
    hierarchy_level,
    is_active,
    status_id
  FROM roles
  WHERE id = $1
  LIMIT 1
`;

// Case-insensitive name lookup — $1: role_name (string)
const ROLE_RESOLVE_BY_NAME_QUERY = `
  SELECT id
  FROM roles
  WHERE LOWER(name) = LOWER($1)
  LIMIT 1
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const ROLE_LOOKUP_TABLE = 'roles r';

// Status join included — filter builder may apply status conditions.
const ROLE_LOOKUP_JOINS = ['LEFT JOIN status s ON s.id = r.status_id'];

const ROLE_LOOKUP_SORT_WHITELIST = new Set([
  'r.hierarchy_level',
  'r.name',
  'r.created_at',
]);

// Tie-break by name after primary hierarchy_level sort.
const ROLE_LOOKUP_ADDITIONAL_SORTS = [{ column: 'r.name', direction: 'ASC' }];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildRoleFilter.
 * @returns {string}
 */
const buildRoleLookupQuery = (whereClause) => `
  SELECT
    r.id,
    r.name,
    r.role_group,
    r.hierarchy_level,
    r.parent_role_id,
    r.is_active,
    r.status_id
  FROM ${ROLE_LOOKUP_TABLE}
  LEFT JOIN status s ON s.id = r.status_id
  WHERE ${whereClause}
`;

module.exports = {
  ROLE_GET_BY_ID_QUERY,
  ROLE_RESOLVE_BY_NAME_QUERY,
  ROLE_LOOKUP_TABLE,
  ROLE_LOOKUP_JOINS,
  ROLE_LOOKUP_SORT_WHITELIST,
  ROLE_LOOKUP_ADDITIONAL_SORTS,
  buildRoleLookupQuery,
};
