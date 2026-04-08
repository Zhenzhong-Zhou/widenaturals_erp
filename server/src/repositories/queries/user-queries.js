/**
 * @file user-queries.js
 * @description SQL query constants and factory functions for user-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - INSERT_USER_QUERY               — insert a new user row
 *  - USER_EXISTS_BY_FIELD_QUERY      — factory for field-scoped existence check
 *  - ACTIVE_USER_EXISTS_BY_EMAIL_QUERY — existence check for active user by email
 *  - GET_AUTH_USER_BY_ID_QUERY       — lightweight auth fetch by user id
 *  - GET_USER_PROFILE_BY_ID_QUERY    — full profile fetch with role permissions CTE
 *  - USER_LIST_TABLE                 — aliased table name for paginated user list
 *  - USER_LIST_JOINS                 — join array for paginated user list query
 *  - USER_LIST_SORT_WHITELIST        — valid sort fields for paginated user list
 *  - buildPaginatedUsersQuery        — factory for paginated user list query
 *  - USER_LOOKUP_TABLE               — aliased table name for user lookup query
 *  - USER_LOOKUP_SORT_WHITELIST      — valid sort fields for user lookup query
 *  - USER_LOOKUP_ADDITIONAL_SORTS    — deterministic tie-break sort columns
 *  - buildUserLookupQuery            — factory for user lookup query
 *  - buildUserLookupJoins            — factory for conditional user lookup joins
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert ───────────────────────────────────────────────────────────────────

// $1: email, $2: role_id, $3: status_id, $4: firstname, $5: lastname,
// $6: phone_number, $7: job_title, $8: note, $9: created_by,
// $10: updated_by, $11: updated_at
const INSERT_USER_QUERY = `
  INSERT INTO users (
    email,
    role_id,
    status_id,
    firstname,
    lastname,
    phone_number,
    job_title,
    note,
    created_by,
    updated_by,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  RETURNING
    id,
    email,
    role_id,
    status_id,
    created_at
`;

// ─── Existence Checks ─────────────────────────────────────────────────────────

/**
 * Builds an existence check query for a single allowed field.
 *
 * Only 'id' and 'email' are valid — caller must validate before invoking.
 *
 * @param {'id'|'email'} field
 * @returns {string}
 */
const buildUserExistsByFieldQuery = (field) => `
  SELECT 1
  FROM users
  WHERE ${field} = $1
  LIMIT 1
`;

// $1: email, $2: active_status_id
const ACTIVE_USER_EXISTS_BY_EMAIL_QUERY = `
  SELECT 1
  FROM users
  WHERE email = $1
    AND status_id = $2
  LIMIT 1
`;

// ─── Auth Fetch ───────────────────────────────────────────────────────────────

// $1: user_id
const GET_AUTH_USER_BY_ID_QUERY = `
  SELECT
    u.id,
    u.role_id,
    u.status_id,
    s.name AS status_name
  FROM users u
  LEFT JOIN status s ON s.id = u.status_id
  WHERE u.id = $1
  LIMIT 1
`;

// ─── User Profile ─────────────────────────────────────────────────────────────

// $1: user_id, $2: active_status_id
const GET_USER_PROFILE_BY_ID_QUERY = `
  WITH role_permissions_agg AS (
    SELECT
      rp.role_id,
      jsonb_agg(
        jsonb_build_object(
          'id',   p.id,
          'key',  p.key,
          'name', p.name
        )
        ORDER BY p.key
      ) AS permissions
    FROM role_permissions rp
    JOIN permissions p
      ON p.id = rp.permission_id
     AND p.status_id = $2
    WHERE rp.status_id = $2
    GROUP BY rp.role_id
  )
  SELECT
    u.id,
    u.email,
    u.firstname,
    u.lastname,
    u.phone_number,
    u.job_title,
    u.is_system,
    s.id              AS status_id,
    s.name            AS status_name,
    u.status_date,
    r.id              AS role_id,
    r.name            AS role_name,
    r.role_group,
    r.hierarchy_level,
    COALESCE(rpa.permissions, '[]'::jsonb) AS permissions,
    ui.image_url      AS avatar_url,
    ui.file_format    AS avatar_format,
    ui.uploaded_at    AS avatar_uploaded_at,
    u.created_at,
    u.updated_at,
    u.created_by,
    cu.firstname      AS created_by_firstname,
    cu.lastname       AS created_by_lastname,
    u.updated_by,
    uu.firstname      AS updated_by_firstname,
    uu.lastname       AS updated_by_lastname
  FROM users u
  JOIN status s                        ON s.id = u.status_id
  LEFT JOIN roles r                    ON r.id = u.role_id
  LEFT JOIN role_permissions_agg rpa   ON rpa.role_id = r.id
  LEFT JOIN user_images ui             ON ui.user_id = u.id AND ui.is_primary = TRUE
  LEFT JOIN users cu                   ON cu.id = u.created_by
  LEFT JOIN users uu                   ON uu.id = u.updated_by
  WHERE u.id = $1
`;

// ─── Paginated User List ──────────────────────────────────────────────────────

const USER_LIST_TABLE = 'users u';

const USER_LIST_JOINS = [
  'LEFT JOIN roles r                       ON r.id = u.role_id',
  'LEFT JOIN status s                      ON s.id = u.status_id',
  'LEFT JOIN users cb                      ON cb.id = u.created_by',
  'LEFT JOIN users ub                      ON ub.id = u.updated_by',
  `LEFT JOIN (
    SELECT user_id, image_url
    FROM user_images
    WHERE is_primary = TRUE
  ) ui ON ui.user_id = u.id`,
];

const _USER_LIST_JOINS_SQL = USER_LIST_JOINS.join('\n  ');

const USER_LIST_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.userSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildUserFilter.
 * @returns {string}
 */
const buildPaginatedUsersQuery = (whereClause) => `
  SELECT
    u.id,
    u.firstname,
    u.lastname,
    u.email,
    u.phone_number,
    u.job_title,
    u.created_at,
    u.created_by,
    cb.firstname          AS created_by_firstname,
    cb.lastname           AS created_by_lastname,
    u.updated_at,
    u.updated_by,
    ub.firstname          AS updated_by_firstname,
    ub.lastname           AS updated_by_lastname,
    u.role_id,
    r.name                AS role_name,
    u.status_id,
    s.name                AS status_name,
    u.status_date,
    ui.image_url          AS avatar_url
  FROM ${USER_LIST_TABLE}
  ${_USER_LIST_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── User Lookup ──────────────────────────────────────────────────────────────

const USER_LOOKUP_TABLE = 'users u';

const USER_LOOKUP_SORT_WHITELIST = new Set([
  'u.firstname',
  'u.lastname',
  'u.email',
  'u.id',
]);

const USER_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'u.lastname', direction: 'ASC' },
  { column: 'u.email',    direction: 'ASC' },
];

/**
 * Builds the join array for the user lookup query.
 *
 * Joins are conditional on capability flags resolved by the service/ACL layer.
 *
 * @param {boolean} canSearchRole   - Include roles join.
 * @param {boolean} canSearchStatus - Include status join.
 * @returns {string[]}
 */
const buildUserLookupJoins = (canSearchRole, canSearchStatus) => {
  const joins = [];
  if (canSearchRole)   joins.push('LEFT JOIN roles r  ON r.id = u.role_id');
  if (canSearchStatus) joins.push('LEFT JOIN status s ON s.id = u.status_id');
  return joins;
};

/**
 * @param {string}   whereClause - Parameterised WHERE predicate from buildUserFilter.
 * @param {string[]} joins       - Join array from buildUserLookupJoins.
 * @returns {string}
 */
const buildUserLookupQuery = (whereClause, joins) => `
  SELECT
    u.id,
    u.email,
    u.firstname,
    u.lastname,
    u.status_id
  FROM ${USER_LOOKUP_TABLE}
  ${joins.join('\n  ')}
  WHERE ${whereClause}
`;

module.exports = {
  INSERT_USER_QUERY,
  buildUserExistsByFieldQuery,
  ACTIVE_USER_EXISTS_BY_EMAIL_QUERY,
  GET_AUTH_USER_BY_ID_QUERY,
  GET_USER_PROFILE_BY_ID_QUERY,
  USER_LIST_TABLE,
  USER_LIST_JOINS,
  USER_LIST_SORT_WHITELIST,
  buildPaginatedUsersQuery,
  USER_LOOKUP_TABLE,
  USER_LOOKUP_SORT_WHITELIST,
  USER_LOOKUP_ADDITIONAL_SORTS,
  buildUserLookupQuery,
  buildUserLookupJoins,
};
