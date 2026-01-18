const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Fetches permission keys assigned to a role using a resolved status ID.
 *
 * Intended for authorization resolution and permission hydration
 * during authentication or runtime permission checks.
 *
 * Constraints:
 * - Role must match the provided status
 * - Permissions must match the provided status
 * - Role-permission links must match the provided status
 *
 * @param {string} roleId
 * @param {string} statusId - Resolved status ID (e.g. ACTIVE)
 *
 * @returns {Promise<{
 *   role_name: string,
 *   permissions: string[]
 * }>}
 */
const getRolePermissionsByRoleId = async (roleId, statusId) => {
  const context = 'role-permission-repository/getRolePermissionsByRoleId';
  
  const queryText = `
    SELECT
      r.name AS role_name,
      ARRAY_AGG(p.key ORDER BY p.key) AS permissions
    FROM role_permissions rp
    INNER JOIN roles r ON r.id = rp.role_id
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1
      AND rp.status_id = $2
      AND r.status_id = $2
      AND p.status_id = $2
    GROUP BY r.name
  `;
  
  try {
    const result = await query(queryText, [roleId, statusId]);
    
    if (!result.rows.length) {
      throw AppError.notFoundError(
        `No permissions found for role: ${roleId}`
      );
    }
    
    logSystemInfo('Fetched role permissions', {
      context,
      roleId,
      statusId,
      permissionCount: result.rows[0].permissions?.length ?? 0,
    });
    
    return result.rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch role permissions', {
      context,
      roleId,
      statusId,
    });
    
    throw AppError.databaseError(
      'Failed to fetch permissions for the specified role.'
    );
  }
};

module.exports = {
  getRolePermissionsByRoleId,
};
