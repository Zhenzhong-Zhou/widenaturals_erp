const { query } = require('../database/db');

/**
 * Fetches all permissions for a given role ID.
 *
 * @param {uuid} roleId - The ID of the role.
 * @returns {Promise<Array>} - Array of permissions associated with the role.
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
  const params = [roleId];
  const result = await query(text, params);
  return result.rows[0];
};

/**
 * Adds a permission to a role.
 *
 * @param {uuid} roleId - The ID of the role.
 * @param {string} permission - The permission to add.
 * @returns {Promise<void>}
 */
const addPermissionToRole = async (roleId, permission) => {
  const text = `
    INSERT INTO role_permissions (role_id, permission)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING;
  `;
  const params = [roleId, permission];
  await query(text, params);
};

module.exports = {
  getRolePermissionsByRoleId,
  addPermissionToRole,
};
