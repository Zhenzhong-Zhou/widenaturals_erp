/**
 * @file role-permission-repository.js
 * @description Database access layer for role permission records.
 *
 * Exports:
 *  - getRolePermissionsByRoleId — fetch aggregated permissions for a role by status
 */

'use strict';

const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const {
  ROLE_PERMISSIONS_BY_ROLE_QUERY,
} = require('./queries/role-permission-queries');

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Fetches aggregated permissions for a role filtered by status.
 *
 * All three entities — role_permissions, roles, and permissions — must share
 * the same status_id to be included in the result.
 *
 * Not-found check is outside the try block — AppError.notFoundError must
 * not be caught and re-thrown as a databaseError.
 *
 * @param {string} roleId   - UUID of the role.
 * @param {string} statusId - UUID of the active status to filter by.
 *
 * @returns {Promise<{ role_name: string, permissions: string[] }>}
 * @throws  {AppError} Not found error if no permissions exist for the role.
 * @throws  {AppError} Normalized database error if the query fails.
 */
const getRolePermissionsByRoleId = async (roleId, statusId) => {
  const context = 'role-permission-repository/getRolePermissionsByRoleId';
  const params = [roleId, statusId];

  let rows;

  try {
    ({ rows } = await query(ROLE_PERMISSIONS_BY_ROLE_QUERY, params));
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch permissions for the specified role.',
      meta: { roleId, statusId },
      logFn: (err) =>
        logDbQueryError(ROLE_PERMISSIONS_BY_ROLE_QUERY, params, err, {
          context,
          roleId,
        }),
    });
  }

  // Not-found check outside try — throwing notFoundError inside would be
  // caught and re-thrown as a databaseError.
  if (!rows.length) {
    throw AppError.notFoundError(`No permissions found for role: ${roleId}`, {
      context,
      meta: { roleId, statusId },
    });
  }

  return rows[0];
};

module.exports = {
  getRolePermissionsByRoleId,
};
