/**
 * Test Script: Fetch Product Batch Details
 *
 * Mirrors style of:
 *   test-sku-details.js
 *
 * Command:
 *   node src/tests/apis/test-product-batch-details.js
 */

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  fetchProductBatchDetailsService,
} = require('../../services/product-batch-service');

(async () => {
  const client = await pool.connect();
  const logContext = '[Test: fetchProductBatchDetails]';

  try {
    //-----------------------------------------------------
    // 0. Ensure status cache is ready
    //-----------------------------------------------------
    await initStatusCache();

    //-----------------------------------------------------
    // 1. Resolve a test user
    //-----------------------------------------------------
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

    //-----------------------------------------------------
    // 2. VALID TEST CASE (Happy Path)
    //-----------------------------------------------------
    // Replace with a real batch ID from your DB
    const validBatchId = 'REPLACE_WITH_REAL_BATCH_ID';

    console.log('\n==================================================');
    console.log(`${logContext} [CASE 1] VALID BATCH`);
    console.log('==================================================\n');

    try {
      const result = await fetchProductBatchDetailsService(
        validBatchId,
        testUser
      );

      console.log(`${logContext} Result Object:`);
      console.dir(result, { depth: null, colors: true });

      console.log(`${logContext} JSON Preview:\n`);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(
        `${logContext} Unexpected error (VALID CASE):`,
        error.message
      );
    }

    //-----------------------------------------------------
    // 3. NOT FOUND TEST CASE (Expected 404)
    //-----------------------------------------------------
    const notFoundBatchId = '00000000-0000-0000-0000-000000000000';

    console.log('\n==================================================');
    console.log(`${logContext} [CASE 2] NOT FOUND BATCH`);
    console.log('==================================================\n');

    try {
      await fetchProductBatchDetailsService(notFoundBatchId, testUser);
    } catch (error) {
      console.log(`${logContext} Expected Error:`);

      console.log({
        name: error.name,
        message: error.message,
        status: error.status,
        context: error.context,
      });
    }

    //-----------------------------------------------------
    // 4. INVALID INPUT TEST CASE (Optional)
    //-----------------------------------------------------
    const invalidBatchId = null;

    console.log('\n==================================================');
    console.log(`${logContext} [CASE 3] INVALID INPUT`);
    console.log('==================================================\n');

    try {
      await fetchProductBatchDetailsService(invalidBatchId, testUser);
    } catch (error) {
      console.log(`${logContext} Expected Validation/Error:`);

      console.log({
        name: error.name,
        message: error.message,
        status: error.status,
        context: error.context,
      });
    }

    //-----------------------------------------------------
    // 5. FORCED ERROR CASE (Simulate DB failure)
    //-----------------------------------------------------
    console.log('\n==================================================');
    console.log(`${logContext} [CASE 4] FORCED ERROR (Simulated)`);
    console.log('==================================================\n');

    const repo = require('../../repositories/product-batch-repository');
    const originalFn = repo.getProductBatchDetailsById;

    try {
      //--------------------------------------------------
      // Monkey patch: force repository to throw
      //--------------------------------------------------
      repo.getProductBatchDetailsById = async () => {
        throw new Error('Simulated database failure');
      };

      await fetchProductBatchDetailsService(validBatchId, testUser);
    } catch (error) {
      console.log(`${logContext} Expected Service Error:`);

      console.log({
        name: error.name,
        message: error.message,
        status: error.status,
        context: error.context,
      });
    } finally {
      //--------------------------------------------------
      // Restore original function (CRITICAL)
      //--------------------------------------------------
      repo.getProductBatchDetailsById = originalFn;
    }
  } catch (error) {
    console.error(`${logContext} Fatal Error:`, error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
})();
