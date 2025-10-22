/**
 * @fileoverview
 * Manual test script for `getBomDetailsService`
 *
 * Purpose:
 *   - Execute the BOM Details Service directly for inspection
 *   - Verify SQL join accuracy, data transformation, and summary calculations
 *   - Benchmark query + transformation performance
 *
 * Usage:
 *   node test-fetch-bom-details.js
 *
 * Prerequisites:
 *   - PostgreSQL running and seeded
 *   - A valid BOM ID exists (with related SKU, product, and BOM items)
 *   - `root@widenaturals.com` user available for reference
 */

const { performance } = require('perf_hooks');
const { pool } = require('../../database/db');
const { getBomDetailsService } = require('../../services/bom-service');
const { logSystemException } = require('../../utils/logger');
const chalk = require('chalk');

(async () => {
  const logPrefix = '[Test: BOM_DETAILS]';
  const startTime = performance.now();
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting BOM Details test execution...`);
    
    // --- Step 1: Connect to database
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // --- Step 2: Load test user
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
    
    // --- Step 3: Define test BOM ID
    const bomId = 'ed8a61d2-2c15-4ab1-99d0-0f4996f2e477'; // 🔧 Replace with valid ID
    console.log(`${logPrefix} 🧩 Testing BOM Details for ID: ${chalk.yellow(bomId)}`);
    
    // --- Step 4: Execute service
    console.log(`${logPrefix} ▶️ Executing getBomDetailsService...`);
    const result = await getBomDetailsService(bomId);
    
    if (!result) {
      throw new Error('Service returned null or undefined result.');
    }
    
    // --- Step 5: Display summarized output
    console.log(`${logPrefix} ✅ Service execution completed.\n`);
    
    console.log(`${logPrefix} 🧾 BOM Header Summary:`);
    console.table({
      Product: result.header?.product?.name || 'N/A',
      SKU: result.header?.sku?.code || 'N/A',
      Revision: result.header?.bom?.revision || 'N/A',
      Active: result.header?.bom?.isActive ? 'Yes' : 'No',
      ItemCount: result.details?.length || 0,
    });
    
    console.log(`${logPrefix} 💰 Estimated Summary:`);
    console.table({
      TotalEstimatedCost: result.summary?.totalEstimatedCost ?? '—',
      Currency: result.summary?.currency ?? '—',
      Type: result.summary?.type ?? '—',
    });
    
    console.log(`${logPrefix} 🪶 Full Object (Deep View):`);
    console.dir(result, { depth: null, colors: true });
    
    // --- Step 6: Timing summary
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ⏱️ Test completed in ${chalk.green(`${elapsed}s`)}.`);
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${error.message}`);
    logSystemException(error, 'Test: BOM Details', {
      context: 'test-bom-details',
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
