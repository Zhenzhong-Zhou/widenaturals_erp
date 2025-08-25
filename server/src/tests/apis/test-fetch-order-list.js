/**
 * Script to test fetching paginated orders for a specific user and category.
 * Adjust email, filters, category, and pagination settings as needed.
 */

const { pool } = require('../../database/db');
const { fetchPaginatedOrdersService } = require('../../services/order-service');

(async () => {
  const client = await pool.connect();
  
  try {
    // Step 1: Fetch test user (adjust email as needed)
    const {
      rows: [user],
    } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1`,
      // ['root@widenaturals.com']
      ['jp@widenaturals.com']
    );
    
    if (!user) {
      throw new Error('User not found for given email');
    }
    
    const enrichedUser = {
      id: user.id,
      role: user.role_id,
    };
    
    // Step 2: Fetch paginated orders for user and category
    const result = await fetchPaginatedOrdersService({
      filters: {
        // Example filters (uncomment and modify as needed)
        // keyword: 'nmn',
        // createdBy: user.id,
      },
      user: enrichedUser,
      category: 'sales', // or 'manufacturing', 'transfer', etc.
      page: 1,
      limit: 50,
      client,
    });
    
    console.dir(result, { depth: null, colors: true });
  } catch (error) {
    console.error('❌ Failed to fetch paginated orders:', error.message);
  } finally {
    client.release();
  }
})();
