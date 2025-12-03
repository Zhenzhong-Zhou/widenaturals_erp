/**
 * @fileoverview
 * Manual test script for `updateProductStatusService`.
 *
 * Purpose:
 *   - Execute and verify the product status update service end-to-end.
 *   - Dynamically fetch product ID and status ID from the database by name.
 *   - Validate business logic (status transition rules) and DB update effects.
 *   - Benchmark transaction + lock performance and structured logging.
 *
 * Usage:
 *   node test-update-product-status.js
 *
 * Prerequisites:
 *   - PostgreSQL instance with `products` and `status` tables populated.
 *   - A valid product (by name) exists in the DB.
 *   - A system user (e.g. `root@widenaturals.com`) exists.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const {
  updateProductStatusService,
} = require('../../services/product-service');
const AppError = require('../../utils/AppError');
const { initAllStatusCaches } = require('../../config/status-cache');

(async () => {
  const logPrefix = chalk.cyan('[Test: UPDATE_PRODUCT_STATUS]');
  const startTime = performance.now();
  let client;

  try {
    await initAllStatusCaches();

    console.log(`${logPrefix} 🚀 Starting product status update test...`);

    // --- Step 1: Connect to DB ---
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);

    // --- Step 2: Load system user ---
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

    // --- Step 3: Select product by name ---
    const productName = 'NMN 3000'; // 🔧 change to any existing product name
    const { rows: productRows } = await client.query(
      `SELECT id, name, status_id FROM products WHERE name = $1 LIMIT 1`,
      [productName]
    );
    if (productRows.length === 0)
      throw new AppError.notFoundError(
        `No product found with name: ${productName}`
      );

    const product = productRows[0];
    console.log(
      `${logPrefix} 📦 Found product: ${chalk.yellow(product.name)} (id: ${product.id})`
    );

    // --- Step 4: Select new status by name ---
    const targetStatusName = 'inactive'; // 🔧 change to your target status name
    const { rows: statusRows } = await client.query(
      `SELECT id, name FROM status WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [targetStatusName]
    );
    if (statusRows.length === 0)
      throw new AppError.notFoundError(
        `No status found with name: ${targetStatusName}`
      );

    const targetStatus = statusRows[0];
    console.log(
      `${logPrefix} 🏷️ Target status: ${chalk.green(targetStatus.name)} (${targetStatus.id})`
    );

    // --- Step 5: Execute service ---
    console.log(`${logPrefix} ▶️ Calling updateProductStatusService...`);
    const result = await updateProductStatusService({
      productId: product.id,
      statusId: targetStatus.id,
      user: testUser,
    });

    // --- Step 6: Verify update result ---
    if (!result) throw new Error('Service returned null or invalid result.');

    console.log(`${logPrefix} ✅ Product status updated successfully!`);
    console.log(`${logPrefix} ✅`, result);
    console.table({
      ProductName: product.name,
      PreviousStatusId: product.status_id,
      NewStatusId: targetStatus.id,
    });

    // --- Optional: Fetch updated product for confirmation ---
    const { rows: verifyRows } = await client.query(
      `SELECT p.id, p.name, s.name AS status_name, p.updated_at
       FROM products p
       LEFT JOIN status s ON p.status_id = s.id
       WHERE p.id = $1`,
      [product.id]
    );
    const verified = verifyRows[0];
    console.log(`${logPrefix} 🔎 Verified updated product status:`);
    console.table(verified);

    // --- Step 7: Log timing and success ---
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    logSystemInfo('Product status update test completed successfully', {
      context: 'test-update-product-status',
      productId: product.id,
      newStatusId: targetStatus.id,
      elapsedSeconds: elapsed,
    });
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}.`);
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(
      error,
      'Manual test for updateProductStatusService failed',
      {
        context: 'test-update-product-status',
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
