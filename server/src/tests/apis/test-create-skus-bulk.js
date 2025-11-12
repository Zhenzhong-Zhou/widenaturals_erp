/**
 * @fileoverview
 * Manual test script for `createSkusService`.
 *
 * Purpose:
 *   - Execute and verify the bulk SKU creation service end-to-end.
 *   - Validate SKU auto-generation for multiple SKUs in one transaction.
 *   - Inspect DB changes and structured logs.
 *   - Benchmark transaction and performance.
 *
 * Usage:
 *   node test-create-skus-bulk.js
 *
 * Prerequisites:
 *   - PostgreSQL instance with `products`, `sku_code_bases`, and `skus` tables.
 *   - A valid product (by name) exists.
 *   - A system user (e.g., `root@widenaturals.com`) exists.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const { logSystemInfo, logSystemException } = require('../../utils/system-logger');
const { createSkusService } = require('../../services/sku-service');
const { initStatusCache, getStatusId } = require('../../config/status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: CREATE_SKUS_BULK]');
  const startTime = performance.now();
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting bulk SKU creation test...`);
    
    // --- Step 1: Connect to DB ---
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    await initStatusCache();
    
    // --- Step 2: Load test user ---
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1;`,
      ['root@widenaturals.com']
    );
    if (users.length === 0)
      throw new Error('No test user found with email root@widenaturals.com');
    const testUser = { id: users[0].id, roleId: users[0].role_id };
    console.log(`${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`);

    // --- Step 3: Fetch or insert test products ---
    const inactiveStatusId = getStatusId('general_inactive');
    const productNames = ['Focus', 'Immune', 'Energy']; // 🔧 customize as needed
    
    const { rows: existingProducts } = await client.query(
      `SELECT id, name FROM products WHERE name = ANY($1::text[]);`,
      [productNames]
    );
    
    const existingNames = existingProducts.map(p => p.name);
    const missingNames = productNames.filter(n => !existingNames.includes(n));
    
    if (missingNames.length > 0) {
      console.log(`${logPrefix} ⚙️ Inserting missing test products: ${missingNames.join(', ')}`);
      
      const insertPlaceholders = missingNames
        .map(
          (_, i) =>
            `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`
        )
        .join(', ');
      
      const insertValues = missingNames.flatMap(name => [
        name,                      // name
        'Canaherb Series',         // series
        'Canaherb',                // brand
        'Herbal Natural',          // category
        `${name} test product`,    // description
        inactiveStatusId,          // status_id
        users[0].id,               // created_by
      ]);
      
      const inserted = await client.query(
        `
          INSERT INTO products (name, series, brand, category, description, status_id, created_by)
          VALUES ${insertPlaceholders}
          RETURNING id, name;
        `,
        insertValues
      );
      
      existingProducts.push(...inserted.rows);
    }
    
    console.log(`${logPrefix} 📦 Using products for SKU creation:`);
    console.table(existingProducts.map(p => ({ id: p.id, name: p.name })));

    // --- Step 4: Prepare SKU data payloads ---
    const brandCategoryPairs = [
      // ✅ Existing pairs in your sku_code_bases table
      { brand_code: 'CH', category_code: 'HN' }, // existing: base_code 100
      { brand_code: 'PG', category_code: 'NM' }, // existing: base_code 200
      { brand_code: 'PG', category_code: 'TCM' }, // existing: base_code 300
      { brand_code: 'WN', category_code: 'MO' }, // existing: base_code 400

      // 🧪 New pairs to trigger lazy creation
      { brand_code: 'ZZ', category_code: 'XX' }, // should create base_code 500
      { brand_code: 'AB', category_code: 'CD' }, // should create base_code 600
      { brand_code: 'XY', category_code: 'PR' }, // should create base_code 700
      { brand_code: 'XA', category_code: 'PC' }, // should create base_code 800
    ];
    
    // Use index modulo to assign different brand/category combinations per product
    const skuList = existingProducts.flatMap((p, idx) => {
      const { brand_code, category_code } = brandCategoryPairs[idx % brandCategoryPairs.length];
      
      return [
        {
          product_id: p.id,
          brand_code,
          category_code,
          variant_code: 'R',
          region_code: 'CN',
          barcode: `628942007${880 + idx}`,
          language: 'en',
          country_code: 'CN',
          market_region: 'China',
          size_label: '60 Capsules',
          description: `${p.name} - Regular variant for CN`,
        },
        {
          product_id: p.id,
          brand_code,
          category_code,
          variant_code: 'S',
          region_code: 'CA',
          barcode: `628942007${890 + idx}`,
          language: 'en',
          country_code: 'CA',
          market_region: 'Canada',
          size_label: '120 Capsules',
          description: `${p.name} - Small variant for CA`,
        },
      ];
    });
    
    console.log(`${logPrefix} 🧾 Prepared SKU payloads (x${skuList.length})`);
    console.table(
      skuList.map(s => ({
        product: existingProducts.find(p => p.id === s.product_id)?.name,
        skuVariant: s.variant_code,
        region: s.region_code,
        barcode: s.barcode,
      }))
    );
    
    // --- Step 5: Call service ---
    console.log(`${logPrefix} ▶️ Calling createSkusService...`);
    const results = await createSkusService(skuList, testUser);
    
    // --- Step 6: Validate result ---
    if (!Array.isArray(results) || results.length === 0)
      throw new Error('Service returned invalid or empty result.');
    
    console.log(`${logPrefix} ✅ SKUs created successfully!`);
    console.table(
      results.map((r) => ({
        sku_id: r.id,
        sku_code: r.skuCode,
      }))
    );
    
    // --- Step 7: Verify from DB ---
    const ids = results.map((r) => `'${r.id}'`).join(', ');
    const { rows: verifyRows } = await client.query(
      `SELECT s.id, s.sku, s.barcode, p.name AS product_name, s.created_at
       FROM skus s
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id IN (${ids})
       ORDER BY s.created_at DESC;`
    );
    console.log(`${logPrefix} 🔎 Verified SKUs in database:`);
    console.table(verifyRows);
    
    // --- Step 8: Log timing ---
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logSystemInfo('Bulk SKU creation test completed successfully', {
      context: 'test-create-skus-bulk',
      productIds: existingProducts.map(p => p.id),
      skuCount: results.length,
      elapsedSeconds: elapsed,
    });
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}.`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(error, 'Manual test for createSkusService failed', {
      context: 'test-create-skus-bulk',
    });
    process.exitCode = 1;
  } finally {
    // --- Cleanup ---
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released.`);
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed.`);
    process.exit(process.exitCode);
  }
})();
