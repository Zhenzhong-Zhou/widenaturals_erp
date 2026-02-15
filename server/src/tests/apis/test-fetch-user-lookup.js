const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { fetchUserLookupService } = require('../../services/lookup-service');

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
      // ['root@widenaturals.com']
      // ['admin@widenaturals.com']
      ['jp@widenaturals.com']
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
    // Execute User Lookup (service-level)
    // ---------------------------------------------------------
    const result = await fetchUserLookupService(user, {
      filters: {
        // keyword: 'john',
        // keyword: 'manager',
      },
      limit: 20,
      offset: 0,
    });

    console.log('User lookup service result:');
    console.dir(result, { depth: null });

    /**
     * Expected behaviors to verify:
     *
     * 1. Regular users:
     *    - Only ACTIVE users returned
     *    - No system users
     *    - No root users
     *    - NO `isActive` flag present
     *
     * 2. Admin / Manager:
     *    - ACTIVE + INACTIVE users
     *    - No system / root users
     *    - `isActive` flag present
     *
     * 3. Root:
     *    - All users
     *    - Includes system + root users
     *    - `isActive` flag present
     *
     * 4. Payload shape:
     *    - { id, label, subLabel?, isActive? }
     *    - No extra fields
     */
  } catch (error) {
    console.error('Failed to fetch user lookup:', error);
  } finally {
    client.release();
  }
})();
