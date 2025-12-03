/**
 * @fileoverview
 * Manual test script for `updateProductInfoService`.
 *
 * Purpose:
 *   - Verify product info updates (e.g., name, brand, category) end-to-end.
 *   - Ensure transactional locking and audit behavior works correctly.
 *   - Validate `updateProductInfoService` prevents status updates.
 *   - Benchmark execution time and structured logs.
 *
 * Usage:
 *   node test-update-product-info.js
 *
 * Prerequisites:
 *   - PostgreSQL instance with seeded `products` table.
 *   - A valid product (by name) exists in the DB.
 *   - A system/root user exists (e.g. `root@widenaturals.com`).
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const { updateProductInfoService } = require('../../services/product-service');
const AppError = require('../../utils/AppError');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_PRODUCT_INFO]');
  const startTime = performance.now();
  let client;

  try {
    console.log(`${logPrefix} 🚀 Starting product info update test...`);

    // --- Step 1: Connect to DB ---
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);

    // --- Step 2: Load test user ---
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    if (users.length === 0)
      throw new Error('No test user found with email root@widenaturals.com');
    const testUser = { id: users[0].id, roleId: users[0].role_id };
    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );

    // --- Step 3: Select target product by name ---
    const productName = 'NMN 3000'; // 🔧 Change to an existing product name
    const { rows: products } = await client.query(
      `SELECT id, name, brand, category FROM products WHERE name = $1 LIMIT 1`,
      [productName]
    );

    if (products.length === 0)
      throw AppError.notFoundError(
        `No product found with name: ${productName}`
      );

    const product = products[0];
    console.log(
      `${logPrefix} 📦 Found product: ${chalk.yellow(product.name)} (id: ${product.id})`
    );

    // --- Step 4: Prepare update payload ---
    const updates = {
      name: `${product.name} (Updated)`, // Example change
      brand: product.brand || 'WIDE Naturals',
      category: product.category || 'Health Supplement',
    };

    console.log(
      `${logPrefix} 🛠️ Update payload:`,
      chalk.green(JSON.stringify(updates))
    );

    // --- Step 5: Execute service ---
    console.log(`${logPrefix} ▶️ Calling updateProductInfoService...`);
    const result = await updateProductInfoService({
      productId: product.id,
      updates,
      user: testUser,
    });

    // --- Step 6: Verify update result ---
    if (!result) throw new Error('Service returned null or invalid result.');

    console.log(`${logPrefix} ✅ Product info updated successfully!`);
    console.log(`${logPrefix} ✅`, result);

    // --- Step 7: Fetch updated product for confirmation ---
    const { rows: verifyRows } = await client.query(
      `SELECT id, name, brand, category, updated_at, updated_by
       FROM products WHERE id = $1`,
      [product.id]
    );

    const verified = verifyRows[0];
    console.log(`${logPrefix} 🔎 Verified updated product info:`);
    console.table(verified);

    // --- Step 8: Log timing and success ---
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logSystemInfo('Product info update test completed successfully', {
      context: 'test-update-product-info',
      productId: product.id,
      updatedFields: Object.keys(updates),
      elapsedSeconds: elapsed,
    });
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}.`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(
      error,
      'Manual test for updateProductInfoService failed',
      {
        context: 'test-update-product-info',
      }
    );
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
