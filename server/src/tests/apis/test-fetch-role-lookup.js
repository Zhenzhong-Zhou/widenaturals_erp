const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { fetchRoleLookupService } = require('../../services/lookup-service');

(async () => {
  const client = await pool.connect();

  try {
    // ---------------------------------------------------------
    // Init shared caches
    // ---------------------------------------------------------
    await initStatusCache();

    // ---------------------------------------------------------
    // Load test user (change email to test ACL behavior)
    // ---------------------------------------------------------
    const { rows } = await client.query(
      `
        SELECT id, role_id
        FROM users
        WHERE email = $1
      `,
      // Try different users:
      ['root@widenaturals.com']
      // ['admin@widenaturals.com']
      // ['jp@widenaturals.com']
    );

    if (!rows.length) {
      throw new Error('Test user not found');
    }

    const user = {
      id: rows[0].id,
      role: rows[0].role_id,
    };

    console.log('Test user context:', user);

    // ---------------------------------------------------------
    // Execute Role Lookup (service-level)
    // ---------------------------------------------------------
    const result = await fetchRoleLookupService(user, {
      filters: {
        // keyword: 'admin',
        // role_group: 'SYSTEM',
      },
      limit: 20,
      offset: 0,
    });

    console.log('Role lookup service result:');
    console.dir(result, { depth: null });

    /**
     * Expected behaviors to verify:
     *
     * 1. Regular users:
     *    - Only ACTIVE roles returned
     *    - No inactive / archived roles
     *    - No hierarchy traversal beyond allowed scope
     *    - `isActive` flag present only if returned by service
     *
     * 2. Admin / Manager:
     *    - ACTIVE + INACTIVE roles
     *    - No restricted system-only roles unless permitted
     *    - `isActive` flag present
     *
     * 3. Root:
     *    - All roles
     *    - Includes system / internal roles
     *    - Includes inactive / archived roles
     *    - `isActive` flag present
     *
     * 4. Payload shape:
     *    - { id, label, isActive?, hierarchyLevel? }
     *    - No raw lifecycle fields (status_id)
     *    - No permission or ACL metadata leaked
     */
  } catch (error) {
    console.error('Failed to fetch role lookup:', error);
  } finally {
    client.release();
  }
})();
