/**
 * Test Script: Fetch SKU Details (with pricing, images, compliance)
 *
 * Mirrors the style of:
 *   test-outboundFulfillment.js
 *
 * Command:
 *   node src/tests/apis/test-sku-details.js
 */

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { fetchSkuDetailsService } = require('../../services/sku-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: fetchSkuDetails]';
  
  try {
    // -----------------------------------------------------
    // 0. Ensure status cache is ready
    // -----------------------------------------------------
    await initStatusCache();
    
    // -----------------------------------------------------
    // 1. Resolve a test user
    // -----------------------------------------------------
    const { rows } = await client.query(
      'SELECT id, role_id FROM users WHERE email = $1',
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} Test user not found.`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    const testUser = { id: userId, role: roleId };
    
    // -----------------------------------------------------
    // 2. Set SKU to test
    // -----------------------------------------------------
    // *** Replace with a real SKU ID from your DB ***
    const skuId = '815d269a-e6d5-4b2a-9206-614f939e7378';
    
    console.log(`${logContext} Testing SKU ID:`, skuId);
    
    // -----------------------------------------------------
    // 3. Execute Service
    // -----------------------------------------------------
    const result = await fetchSkuDetailsService(skuId, testUser);
    
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
