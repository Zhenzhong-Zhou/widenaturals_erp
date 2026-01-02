/**
 * Test Script: Fetch User Profile
 *
 * Mirrors the style of:
 *   - test-sku-details.js
 *   - test-outboundFulfillment.js
 *
 * Command:
 *   node src/tests/apis/test-fetch-user-profile.js
 */

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { fetchUserProfileService } = require('../../services/user-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: fetchUserProfile]';

  try {
    // -----------------------------------------------------
    // 0. Ensure status cache is ready
    // -----------------------------------------------------
    await initStatusCache();

    // -----------------------------------------------------
    // 1. Resolve a test requester (authenticated user)
    // -----------------------------------------------------
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      // ['root@widenaturals.com']
      ['jp@widenaturals.com']
    );

    if (rows.length === 0) {
      console.error(`${logContext} Test requester not found.`);
      return;
    }

    const { id: requesterId, role_id: requesterRoleId } = rows[0];

    const requester = {
      id: requesterId,
      role: requesterRoleId,
    };

    console.log(`${logContext} Requester resolved:`, requester);

    // -----------------------------------------------------
    // 2. Resolve a target user profile
    // -----------------------------------------------------
    // You may use:
    //  - the same user (self-profile)
    //  - a different user (permission test)
    //
    // *** Replace with a real user ID from your DB ***
    const targetUserId = requesterId; // self-profile test

    console.log(`${logContext} Target User ID:`, targetUserId);

    // -----------------------------------------------------
    // 3. Execute Service
    // -----------------------------------------------------
    const result = await fetchUserProfileService(targetUserId, requester);

    // -----------------------------------------------------
    // 4. Logging
    // -----------------------------------------------------
    console.log(`${logContext} Result Object:`);
    console.dir(result, { depth: null, colors: true });

    console.log(`${logContext} JSON Preview:\n`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`${logContext} Error:`, error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
