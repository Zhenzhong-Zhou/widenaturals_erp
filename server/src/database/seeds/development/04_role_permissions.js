/**
 * Seed the `role_permissions` table with initial data.
 * Ensures that roles have the appropriate permissions.
 *
 * @param {import('knex').Knex} knex - The Knex instance.
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  // Fetch the active status ID dynamically
  const activeStatusId = await knex('status')
    .select('id')
    .where('name', 'active')
    .first()
    .then((row) => row.id);

  // Define roles and their associated permissions (by `key`)
  const rolePermissionsData = {
    root_admin: ['root_access'],
    admin: ['manage_users', 'view_dashboard', 'view_reports'],
    user: ['view_dashboard', 'edit_profile'],
  };

  // Insert role-permissions
  for (const [roleKey, permissionsKeys] of Object.entries(
    rolePermissionsData
  )) {
    // Fetch role ID by key
    const role = await knex('roles')
      .select('id')
      .where('name', roleKey)
      .first();

    if (!role) {
      console.warn(`Role ${roleKey} not found. Skipping.`);
      continue;
    }

    for (const permissionKey of permissionsKeys) {
      // Fetch permission ID by key
      const permission = await knex('permissions')
        .select('id')
        .where('key', permissionKey)
        .first();

      if (!permission) {
        console.warn(`Permission ${permissionKey} not found. Skipping.`);
        continue;
      }

      // Insert role-permission mapping
      await knex('role_permissions')
        .insert({
          id: knex.raw('uuid_generate_v4()'),
          role_id: role.id,
          permission_id: permission.id,
          status_id: activeStatusId,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .onConflict(['role_id', 'permission_id']) // Avoid duplicate entries
        .ignore();
    }
  }

  console.log('Role-Permissions seeded successfully.');
};
