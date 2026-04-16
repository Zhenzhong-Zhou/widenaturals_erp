const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');

const {
  fetchPackagingMaterialSupplierLookupService,
} = require('../../services/lookup-service');

(async () => {
  const client = await pool.connect();

  try {
    //---------------------------------------------------------
    // Init shared caches
    //---------------------------------------------------------
    await initStatusCache();

    //---------------------------------------------------------
    // Load test user (change email to test ACL behavior)
    //---------------------------------------------------------
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

    //---------------------------------------------------------
    // Execute Packaging Material Supplier Lookup
    //---------------------------------------------------------
    const result = await fetchPackagingMaterialSupplierLookupService(user, {
      filters: {
        // keyword: 'pack',
        // isPreferred: true,
        // packagingMaterialId: 'uuid',
      },
      limit: 20,
      offset: 0,
    });

    console.log('Packaging material supplier lookup result:');
    console.dir(result, { depth: null });

    /**
     * Expected behaviors to verify:
     *
     * 1. Regular users:
     *    - Only ACTIVE suppliers returned
     *    - Archived suppliers excluded
     *    - NO `isActive` flag present
     *
     * 2. Admin / Manager:
     *    - ACTIVE + INACTIVE suppliers
     *    - Archived suppliers still excluded by default
     *    - `isActive` flag present
     *
     * 3. Root users:
     *    - All suppliers visible
     *    - Archived suppliers visible if explicitly requested
     *    - `isActive` flag present
     *
     * 4. Payload shape:
     *    - { id, label, subLabel?, isActive?, isPreferred? }
     *
     * Example:
     *
     * {
     *   items: [
     *     {
     *       id: "uuid",
     *       label: "ABC Packaging Ltd",
     *       subLabel: "ABC-PACK",
     *       isActive: true,
     *       isPreferred: true
     *     }
     *   ],
     *   hasMore: false,
     *   offset: 0
     * }
     */
  } catch (error) {
    console.error('Failed to fetch packaging material supplier lookup:', error);
  } finally {
    client.release();
  }
})();
