const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Fetches all permissions for a given role ID.
 *
 * @param {uuid} roleId - The ID of the role.
 * @returns {Promise<Array>} - Array of permissions associated with the role.
 * @throws {AppError} - Throws an error if the query fails or no permissions are found.
 */
const getRolePermissionsByRoleId = async (roleId) => {
  const text = `
    SELECT
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
    GROUP BY r.name;
  `;

  try {
    const params = [roleId];
    const result = await query(text, params);

    if (!result.rows.length || !result.rows[0].permissions) {
      throw new AppError('No permissions found for the specified role.', 404, {
        type: 'DatabaseError',
        isExpected: true,
      });
    }

    return result.rows[0].permissions;
  } catch (error) {
    logError('Error fetching permissions for role:', {
      roleId,
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
