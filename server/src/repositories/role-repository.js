const { query } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetch a role by its ID.
 *
 * Repository-layer function:
 * - Fetches raw role data
 * - Does NOT enforce business rules (e.g. active/inactive)
 * - Throws raw database errors
 *
 * @param {string} roleId
 * @param {object} client - Optional transaction client
 * @returns {Promise<Object|null>} Role row or null if not found
 */
const getRoleById = async (roleId, client) => {
  const context = 'role-repository/getRoleById';
  
  const sql = `
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
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(sql, [roleId], client);
    return rows[0] || null;
  } catch (error) {
    logSystemException(error, 'Failed to fetch role by ID', {
      context,
      roleId,
    });
    throw error; // raw error only
  }
};

/**
 * Resolves a role ID by role name.
 *
 * Repository-layer function.
 *
 * Characteristics:
 * - Bootstrap-safe (no status or permission enforcement)
 * - Case-insensitive role name matching
 * - Single-responsibility: ID resolution only
 *
 * Intended usage:
 * - Root admin initialization
 * - Database seeding
 * - System bootstrap flows
 *
 * NOT intended for:
 * - Authorization checks
 * - Active/inactive role validation
 *
 * @param {string} roleName - Role name to resolve
 * @param {object} [client] - Optional transaction client
 *
 * @returns {Promise<string>} Role ID
 *
 * @throws {AppError} If role does not exist or query fails
 */
const resolveRoleIdByName = async (roleName, client) => {
  const context = 'role-repository/resolveRoleIdByName';
  
  if (!roleName || typeof roleName !== 'string') {
    throw AppError.validationError('Role name is required.', {
      context,
    });
  }
  
  const sql = `
    SELECT id
    FROM roles
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;
  
  try {
    const { rows } = await query(sql, [roleName], client);
    
    if (!rows.length) {
      throw AppError.notFoundError(`Required role "${roleName}" not found.`, {
        context,
        roleName,
      });
    }
    
    logSystemInfo('Resolved role ID by name', {
      context,
      roleName,
      roleId: rows[0].id,
    });
    
    return rows[0].id;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logSystemException(error, 'Failed to resolve role ID by name', {
      context,
      roleName,
    });
    
    throw AppError.databaseError('Failed to resolve role ID.', {
      context,
      cause: error,
    });
  }
};

module.exports = {
  getRoleById,
  resolveRoleIdByName,
};
