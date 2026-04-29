/**
 * @file user-repository.js
 * @description Database access layer for user records.
 *
 * Mixed pattern — two distinct error handling strategies coexist:
 *
 *  Auth infrastructure functions (insertUser, getAuthUserById):
 *    - Raw re-throws — auth service owns error handling
 *    - Security-relevant success logging retained
 *
 *  Domain functions (getPaginatedUsers, getUserProfileById, getUserLookup,
 *    userExistsByField, activeUserExistsByEmail):
 *    - handleDbError wrapping
 *    - No success logging
 *
 * Exports:
 *  - insertUser               — insert a new user row
 *  - userExistsByField        — existence check by id or email
 *  - activeUserExistsByEmail  — existence check for active user by email
 *  - getPaginatedUsers        — paginated user list with filtering and sorting
 *  - getUserProfileById       — full profile fetch with role permissions
 *  - getUserLookup            — offset-paginated user dropdown list
 *  - getAuthUserById          — lightweight auth fetch by user id
 */

'use strict';

const { query } = require('../database/db');
const {
  paginateQueryByOffset,
  paginateQuery,
} = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/logging/system-logger');
const { maskEmail } = require('../utils/masking/mask-primitives');
const AppError = require('../utils/AppError');
const { buildUserFilter } = require('../utils/sql/build-user-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
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
} = require('./queries/user-queries');

// ─── Insert (auth infrastructure) ────────────────────────────────────────────

/**
 * Inserts a new user row and returns the created record.
 *
 * @param {Object}                  user
 * @param {string}                  user.email
 * @param {string}                  user.roleId
 * @param {string}                  user.statusId
 * @param {string}                  user.firstname
 * @param {string}                  user.lastname
 * @param {string|null}             [user.phoneNumber]
 * @param {string|null}             [user.jobTitle]
 * @param {string|null}             [user.note]
 * @param {string}                  user.createdBy
 * @param {string|null}             [user.updatedBy]
 * @param {Date|null}               [user.updatedAt]
 * @param {import('pg').PoolClient} client - Transaction client.
 *
 * @returns {Promise<Object>} Inserted user row.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const insertUser = async (user, client) => {
  const context = 'user-repository/insertUser';

  const {
    email,
    roleId,
    statusId,
    firstname,
    lastname,
    phoneNumber,
    jobTitle,
    note,
    createdBy,
    updatedBy = null,
    updatedAt = null,
  } = user;

  const params = [
    email,
    roleId,
    statusId,
    firstname,
    lastname,
    phoneNumber,
    jobTitle,
    note,
    createdBy,
    updatedBy,
    updatedAt,
  ];

  try {
    const { rows } = await query(INSERT_USER_QUERY, params, client);
    return rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert user.',
      meta: { email: maskEmail(email) },
      logFn: (err) =>
        logDbQueryError(INSERT_USER_QUERY, params, err, { context }),
    });
  }
};

// ─── Existence Checks ─────────────────────────────────────────────────────────

/**
 * Returns true if a user with the given field value exists.
 *
 * @param {'id'|'email'}            field  - Field to check against.
 * @param {string}                  value  - Value to match.
 * @param {import('pg').PoolClient} [client]
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} validationError if field is not 'id' or 'email'.
 * @throws  {AppError} databaseError if the query fails.
 */
const userExistsByField = async (field, value, client) => {
  const context = 'user-repository/userExistsByField';

  if (!['id', 'email'].includes(field)) {
    throw AppError.validationError('Invalid field for user existence check.', {
      context,
      field,
    });
  }

  const queryText = buildUserExistsByFieldQuery(field);
  const params = [value];

  try {
    const { rowCount } = await query(queryText, params, client);
    return rowCount > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check user existence.',
      meta: { field },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, { context, field }),
    });
  }
};

/**
 * Returns true if an active user with the given email exists.
 *
 * @param {string}                  email          - Email to check.
 * @param {string}                  activeStatusId - UUID of the active status.
 * @param {import('pg').PoolClient} [client]
 *
 * @returns {Promise<boolean>}
 * @throws  {AppError} databaseError if the query fails.
 */
const activeUserExistsByEmail = async (email, activeStatusId, client) => {
  const context = 'user-repository/activeUserExistsByEmail';
  const params = [email, activeStatusId];

  try {
    const { rowCount } = await query(
      ACTIVE_USER_EXISTS_BY_EMAIL_QUERY,
      params,
      client
    );
    return rowCount > 0;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to check active user existence.',
      meta: { email },
      logFn: (err) =>
        logDbQueryError(ACTIVE_USER_EXISTS_BY_EMAIL_QUERY, params, err, {
          context,
          email,
        }),
    });
  }
};

// ─── Paginated User List ──────────────────────────────────────────────────────

/**
 * Fetches paginated user records with optional filtering and sorting.
 *
 * Joins roles, status, audit users, and primary avatar image.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via userSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedUsers = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'DESC',
}) => {
  const context = 'user-repository/getPaginatedUsers';

  const { whereClause, params } = buildUserFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'userSortMap',
    defaultSort: SORTABLE_FIELDS.userSortMap.defaultNaturalSort,
  });

  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildPaginatedUsersQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: USER_LIST_TABLE,
      joins: USER_LIST_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: USER_LIST_SORT_WHITELIST,
      meta: { context },
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated user records.',
      meta: { filters, page, limit, sortBy, sortOrder },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          page,
          limit,
        }),
    });
  }
};

// ─── User Profile ─────────────────────────────────────────────────────────────

/**
 * Fetches full user profile by id including role, permissions, and avatar.
 *
 * Returns null if no matching user exists.
 *
 * @param {string} userId          - UUID of the user to fetch.
 * @param {string} activeStatusId  - UUID of the active status (used to scope permissions).
 *
 * @returns {Promise<Object|null>} User profile row, or null if not found.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getUserProfileById = async (userId, activeStatusId) => {
  const context = 'user-repository/getUserProfileById';
  const params = [userId, activeStatusId];

  try {
    const { rows } = await query(GET_USER_PROFILE_BY_ID_QUERY, params);
    return rows[0] ?? null;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch user profile.',
      meta: { userId },
      logFn: (err) =>
        logDbQueryError(GET_USER_PROFILE_BY_ID_QUERY, params, err, {
          context,
          userId,
        }),
    });
  }
};

// ─── User Lookup ──────────────────────────────────────────────────────────────

/**
 * Fetches offset-paginated user records for dropdown/lookup use.
 *
 * Joins are conditional on capability flags resolved by the service/ACL layer.
 *
 * @param {Object}  options
 * @param {Object}  [filters={}]                  - Field filters.
 * @param {Object}  [options={}]                  - Capability flags.
 * @param {boolean} [options.canSearchRole]       - Include roles join and filter.
 * @param {boolean} [options.canSearchStatus]     - Include status join and filter.
 * @param {number}  [limit=50]                    - Records per page.
 * @param {number}  [offset=0]                    - Record offset.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getUserLookup = async ({
  filters = {},
  options = {},
  limit = 50,
  offset = 0,
}) => {
  const context = 'user-repository/getUserLookup';

  const { canSearchRole = false, canSearchStatus = false } = options;

  const joins = buildUserLookupJoins(canSearchRole, canSearchStatus);
  const { whereClause, params } = buildUserFilter(filters, {
    canSearchRole,
    canSearchStatus,
  });

  const queryText = buildUserLookupQuery(whereClause, joins);

  try {
    return await paginateQueryByOffset({
      tableName: USER_LOOKUP_TABLE,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'u.firstname',
      sortOrder: 'ASC',
      additionalSorts: USER_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet: USER_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch user lookup.',
      meta: { filters, offset, limit, options },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          offset,
          limit,
        }),
    });
  }
};

// ─── Auth Fetch (auth infrastructure) ────────────────────────────────────────

/**
 * Fetches a lightweight user row for auth middleware use.
 *
 * Returns null if no matching user exists.
 *
 * @param {string}                  userId   - UUID of the user to fetch.
 * @param {import('pg').PoolClient} [client] - Optional transaction client.
 *
 * @returns {Promise<Object|null>} Auth user row, or null if not found.
 * @throws  Propagates raw DB error — auth service owns error handling.
 */
const getAuthUserById = async (userId, client = null) => {
  const context = 'user-repository/getAuthUserById';

  try {
    const { rows } = await query(GET_AUTH_USER_BY_ID_QUERY, [userId], client);

    if (!rows[0]) return null;

    logSystemInfo('Auth user fetched by ID', {
      context,
      userId: rows[0].id,
      roleId: rows[0].role_id,
      status: rows[0].status_name,
    });

    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch auth user by ID', {
      context,
      userId,
    });
    throw error;
  }
};

module.exports = {
  insertUser,
  userExistsByField,
  activeUserExistsByEmail,
  getPaginatedUsers,
  getUserProfileById,
  getUserLookup,
  getAuthUserById,
};
