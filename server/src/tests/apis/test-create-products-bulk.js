/**
 * @fileoverview
 * Manual test script for `createProductsService`.
 *
 * Purpose:
 *   - Execute and verify bulk product creation end-to-end.
 *   - Validate business-layer normalization and repository bulk insert behavior.
 *   - Confirm audit fields, status fields, and DB triggers.
 *   - Inspect DB output and system logs.
 *
 * Usage:
 *   node test-create-products-bulk.js
 *
 * Prerequisites:
 *   - PostgreSQL database with `products` table ready.
 *   - Status cache initialized (e.g., general_active/general_inactive).
 *   - A valid system user exists (e.g., root@widenaturals.com).
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { initStatusCache } = require('../../config/status-cache');
const { createProductsService } = require('../../services/product-service');

(async () => {
  const prefix = chalk.cyan('[Test: CREATE_PRODUCTS_BULK]');
  const start = performance.now();
  let client;
  
  try {
    console.log(`${prefix} 🚀 Starting bulk product creation test...`);
    
    // ------------------------------------------------------------
    // Step 1: DB Connection
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${prefix} ✅ Connected to database.`);
    
    await initStatusCache();
    
    // ------------------------------------------------------------
    // Step 2: Load Test User
    // ------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, email FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    
    if (users.length === 0) {
      throw new Error('Test user not found: root@widenaturals.com');
    }
    
    const testUser = { id: users[0].id };
    console.log(`${prefix} 👤 Using test user: ${chalk.green(users[0].email)}`);
    
    // ------------------------------------------------------------
    // Step 3: Prepare Product Payloads
    // ------------------------------------------------------------
    const productList = [
      {
        name: 'Herbal Boost',
        series: 'Wellness Series',
        brand: 'Canaherb',
        category: 'Herbal',
        description: 'Herbal Boost – Support formula for vitality',
      },
      {
        name: 'Omega Pure 1200',
        series: 'Premium Oils',
        brand: 'Widenaturals',
        category: 'Omega',
        description: 'High-potency omega blend',
      },
      {
        name: 'Vitamin Max 500',
        series: 'Core Vitamins',
        brand: 'Canaherb',
        category: 'Vitamins',
        description: 'Daily multivitamin blend',
      }
    ];
    
    console.log(`${prefix} 🧾 Prepared product payloads:`);
    console.table(
      productList.map((p) => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
      }))
    );
    
    // ------------------------------------------------------------
    // Step 4: Execute Service
    // ------------------------------------------------------------
    console.log(`${prefix} ▶️ Calling createProductsService...`);
    
    const inserted = await createProductsService(productList, testUser);
    
    if (!Array.isArray(inserted) || inserted.length === 0) {
      throw new Error('Service returned empty result set.');
    }
    
    console.log(`${prefix} ✅ Products created successfully:`);
    console.table(
      inserted.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
      }))
    );
    
    // ------------------------------------------------------------
    // Step 5: DB Verification
    // ------------------------------------------------------------
    const ids = inserted.map((p) => `'${p.id}'`).join(', ');
    const { rows: verifyRows } = await client.query(
      `SELECT id, name, brand, category, status_id, created_at
       FROM products
       WHERE id IN (${ids})
       ORDER BY created_at DESC;`
    );
    
    console.log(`${prefix} 🔎 Verified products in database:`);
    console.table(verifyRows);
    
    // ------------------------------------------------------------
    // Step 6: Timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    console.log(`${prefix} ⏱️ Test completed in ${chalk.green(`${elapsed}s`)}.`);
    
    logSystemInfo('Bulk product creation test completed successfully', {
      context: 'test-create-products-bulk',
      inputCount: productList.length,
      insertedCount: inserted.length,
      elapsedSeconds: elapsed,
    });
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${prefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(error, 'Manual test for createProductsService failed', {
      context: 'test-create-products-bulk',
    });
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${prefix} 🧹 DB client released.`);
    
    await pool.end().catch(() => {});
    console.log(`${prefix} 🏁 Pool closed.`);
    
    process.exit(process.exitCode);
  }
})();
