/**
 * @file role-permission-queries.js
 * @description SQL query constants for role-permission-repository.js.
 *
 * Exports:
 *  - ROLE_PERMISSIONS_BY_ROLE_QUERY — fetch aggregated permissions for a role
 */

'use strict';

// Fetches all active permissions for a role in a single aggregated row.
// All three entities (role_permissions, roles, permissions) must share
// the same status_id to be included.
// $1: role_id (UUID), $2: status_id (UUID)
const ROLE_PERMISSIONS_BY_ROLE_QUERY = `
  SELECT
    r.name                            AS role_name,
    ARRAY_AGG(p.key ORDER BY p.key)   AS permissions
  FROM role_permissions rp
  INNER JOIN roles       r ON r.id = rp.role_id
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role_id    = $1
    AND rp.status_id  = $2
    AND r.status_id   = $2
    AND p.status_id   = $2
  GROUP BY r.name
`;

module.exports = {
  ROLE_PERMISSIONS_BY_ROLE_QUERY,
};
