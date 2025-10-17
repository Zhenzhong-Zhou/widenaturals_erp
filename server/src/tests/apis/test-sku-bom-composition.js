/**
 * @fileoverview
 * 🔍 Test script for `getSkuBomCompositionService`
 *
 * Purpose:
 *   - Manually execute the BOM Composition Service
 *   - Verify data transformation and performance timing
 *
 * Usage:
 *   node test-sku-bom-composition.js
 *
 * Prerequisites:
 *   - Database running and seeded
 *   - Valid SKU ID exists with active BOM
 *   - root@widenaturals.com user present
 */

const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { getSkuBomCompositionService } = require('../../services/sku-service');
const { logSystemException } = require('../../utils/logger');
const chalk = require('chalk');

(async () => {
  const logPrefix = '[Test: SKU_BOM_COMPOSITION]';
  const startTime = performance.now();
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting test execution...`);
    
    // --- Step 1: Connect to DB
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // --- Step 2: Load test user (root admin)
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (users.length === 0) {
      throw new Error('No test user found with email root@widenaturals.com');
    }
    
    const testUser = {
      id: users[0].id,
      roleId: users[0].role_id,
    };
    console.log(`${logPrefix} 👤 Using test user:`, JSON.stringify(testUser));
    
    // --- Step 3: Select test SKU ID
    const skuId = '374cfaad-a0ca-44dc-bfdd-19478c21f899'; // replace as needed
    console.log(`${logPrefix} 📦 Testing BOM Composition for SKU: ${chalk.yellow(skuId)}`);
    
    // --- Step 4: Execute Service
    console.log(`${logPrefix} ▶️ Executing getSkuBomCompositionService...`);
    const result = await getSkuBomCompositionService(skuId);
    
    if (!result) {
      throw new Error('Service returned null or undefined result.');
    }
    
    // --- Step 5: Display structured output
    console.log(`${logPrefix} ✅ Service execution completed.\n`);
    
    console.log(`${logPrefix} 🧾 BOM Header Summary:`);
    console.table({
      Product: result.header?.productName || 'N/A',
      SKU: result.header?.sku?.code || 'N/A',
      Revision: result.header?.bom?.revision || 'N/A',
      Active: result.header?.bom?.isActive ? 'Yes' : 'No',
      ItemCount: result.details?.length || 0,
    });
    
    console.log(`${logPrefix} 🪶 Full Object (Depth View):`);
    console.dir(result, { depth: null, colors: true });
    
    // --- Step 6: Timing summary
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ⏱️ Test completed in ${chalk.green(`${elapsed}s`)}.`);
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${error.message}`);
    logSystemException(error, 'Test: SKU BOM Composition', {
      context: 'test-sku-bom-composition',
    });
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released.`);
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed.`);
    process.exit(process.exitCode);
  }
})();
