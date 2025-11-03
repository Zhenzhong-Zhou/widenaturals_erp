const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  fetchPaginatedDiscountLookupService,
} = require('../../services/lookup-service');

(async () => {
  const client = await pool.connect();

  try {
    // Ensure statusMap is ready
    await initStatusCache();

    const { rows } = await client.query(
      `
      SELECT id, role_id FROM users WHERE email = $1
    `,
      ['root@widenaturals.com']
    );
    const user = rows[0];
    const { id, role_id } = user;
    const enrichedUser = {
      id,
      role: role_id,
    };

    const options = {
      filters: { keyword: 'special' },
      limit: 10,
      offset: 0,
    };

    const result = await fetchPaginatedDiscountLookupService(
      enrichedUser,
      options
    );
    console.log('✅ Discount lookup result:', result);
  } catch (error) {
    console.error('❌ Failed to fetch discount lookup:', error.message);
  } finally {
    client.release();
  }
})();
