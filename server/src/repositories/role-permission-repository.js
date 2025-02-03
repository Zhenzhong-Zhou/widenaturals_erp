const { query, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Fetches all permissions for a given role ID with optional row locking and retry mechanism.
 *
 * @param {string} roleId - The UUID of the role to fetch permissions for.
 * @returns {Promise<string[]>} - Array of permission keys associated with the role.
 * @throws {AppError} - Throws an error if the query fails or no permissions are found.
 *
 * @example
 * // Fetch permissions with default lock mode
 * const permissions = await getRolePermissionsByRoleId('role-id-123', dbClient);
 *
 * @example
 * // Fetch permissions with 'FOR UPDATE' lock mode
 * const permissions = await getRolePermissionsByRoleId('role-id-123', dbClient, 'FOR UPDATE');
 */
const getRolePermissionsByRoleId = async (
  roleId,
) => {
  const sql = `
    SELECT
      r.name as role_name,
      ARRAY_AGG(p.key) AS permissions
    FROM role_permissions rp
    INNER JOIN roles r ON rp.role_id = r.id
    INNER JOIN permissions p ON rp.permission_id = p.id
    INNER JOIN status srp ON rp.status_id = srp.id
    INNER JOIN status sr ON r.status_id = sr.id
    INNER JOIN status sp ON p.status_id = sp.id
    WHERE rp.role_id = $1
      AND sr.name = 'active'
      AND sp.name = 'active'
      AND srp.name = 'active'
    GROUP BY r.name
  `;
  
  const params = [roleId];
  
  try {
    return await retry(async () => {
      const result = await query(sql, params);
      
      if (!result.rows.length || !result.rows[0].permissions) {
        throw AppError.notFoundError(
          `No permissions found for the specified role: ${roleId}`
        );
      }
      
      return result.rows[0];
    });
  } catch (error) {
    logError('Error fetching permissions for role:', {
      roleId,
      query: sql,
      error: error.message,
    });
    throw new AppError(
      'Failed to fetch permissions for the specified role.',
      500,
      {
        type: 'DatabaseError',
        isExpected: false,
      }
    );
  }
};

/**
 * Adds a permission to a role.
 *
 * @param {uuid} roleId - The ID of the role.
 * @param {uuid} permissionId - The ID of the permission to add.
 * @returns {Promise<void>}
 * @throws {AppError} - Throws an error if the query fails.
 */
const addPermissionToRole = async (roleId, permissionId) => {
  const text = `
    INSERT INTO role_permissions (role_id, permission_id, status_id, created_at, updated_at)
    VALUES ($1, $2, (SELECT id FROM status WHERE name = 'active'), NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `;

  try {
    const params = [roleId, permissionId];
    await query(text, params);
  } catch (error) {
    logError('Error adding permission to role:', {
      roleId,
      permissionId,
      error: error.message,
    });
    throw new AppError('Failed to add permission to the role.', 500, {
      type: 'DatabaseError',
      isExpected: false,
    });
  }
};

module.exports = {
  getRolePermissionsByRoleId,
  addPermissionToRole,
};
