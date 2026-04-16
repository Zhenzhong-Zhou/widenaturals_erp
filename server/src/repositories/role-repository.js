/**
 * @file role-repository.js
 * @description Database access layer for role records.
 *
 * Exports:
 *  - getRoleById          — fetch single role by id
 *  - resolveRoleIdByName  — resolve role id by name (case-insensitive)
 *  - getRoleLookup        — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const { query, pool } = require('../database/db');
const {
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildRoleFilter } = require('../utils/sql/build-role-filter');
const {
  ROLE_GET_BY_ID_QUERY,
  ROLE_RESOLVE_BY_NAME_QUERY,
  ROLE_LOOKUP_TABLE,
  ROLE_LOOKUP_JOINS,
  ROLE_LOOKUP_SORT_WHITELIST,
  ROLE_LOOKUP_ADDITIONAL_SORTS,
  buildRoleLookupQuery,
} = require('./queries/role-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single role record by ID.
 *
 * Returns null if no role exists for the given ID.
 *
 * @param {string}                  roleId - UUID of the role.
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<Object|null>} Role row, or null if not found.
 * @throws  {AppError}             Normalized database error if the query fails.
 */
const getRoleById = async (roleId, client) => {
  const context = 'role-repository/getRoleById';

  try {
    const { rows } = await query(ROLE_GET_BY_ID_QUERY, [roleId], client);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch role by ID.',
      meta: { roleId },
      logFn: (err) =>
        logDbQueryError(ROLE_GET_BY_ID_QUERY, [roleId], err, {
          context,
          roleId,
        }),
    });
  }
};

// ─── Resolve By Name ─────────────────────────────────────────────────────────

/**
 * Resolves a role UUID by its name (case-insensitive).
 *
 * Not-found check is outside the try block — AppError.notFoundError must
 * not be caught and re-thrown as a databaseError.
 *
 * @param {string}             roleName - Name of the role to look up.
 * @param {PoolClient}         [client] - Optional DB client for transactional context.
 *                                        Falls back to pool if omitted.
 * @returns {Promise<string>}             UUID of the matching role.
 * @throws  {AppError}                    Validation error if roleName is not provided.
 * @throws  {AppError}                    Not found error if no role matches the name.
 * @throws  {AppError}                    Normalized database error if the query fails.
 */
const resolveRoleIdByName = async (roleName, client) => {
  const context = 'role-repository/resolveRoleIdByName';

  const db = client ?? pool; // fall back to pool

  if (!roleName || typeof roleName !== 'string') {
    throw AppError.validationError('Role name is required.', { context });
  }

  let rows;

  try {
    ({ rows } = await query(ROLE_RESOLVE_BY_NAME_QUERY, [roleName], db));
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to resolve role ID by name.',
      meta: { roleName },
      logFn: (err) =>
        logDbQueryError(ROLE_RESOLVE_BY_NAME_QUERY, [roleName], err, {
          context,
          roleName,
        }),
    });
  }

  // Not-found check outside try — throwing notFoundError inside would be
  // caught and re-thrown as a databaseError.
  if (!rows.length) {
    throw AppError.notFoundError(`Required role "${roleName}" not found.`, {
      context,
      meta: { roleName },
    });
  }

  return rows[0].id;
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated role records for dropdown/lookup use.
 *
 * Sorted by hierarchy_level ascending with name as tie-breaker.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getRoleLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'role-repository/getRoleLookup';

  const { whereClause, params } = buildRoleFilter(filters);
  const queryText = buildRoleLookupQuery(whereClause);

  try {
    return await paginateQueryByOffset({
      tableName: ROLE_LOOKUP_TABLE,
      joins: ROLE_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'r.hierarchy_level',
      sortOrder: 'ASC',
      additionalSorts: ROLE_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet: ROLE_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch role lookup.',
      meta: { filters, limit, offset },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          limit,
          offset,
        }),
    });
  }
};

module.exports = {
  getRoleById,
  resolveRoleIdByName,
  getRoleLookup,
};
