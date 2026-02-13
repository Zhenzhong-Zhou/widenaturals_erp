/**
 * @fileoverview
 * Manual test script for `fetchPaginatedProductBatchesService`.
 *
 * Purpose:
 *   - Verify product batch pagination end-to-end
 *   - Validate ACL-driven product batch visibility
 *   - Inspect transformed product batch rows
 *   - Validate status, product, SKU, and manufacturer joins
 *
 * Usage:
 *   node test-paginated-product-batches.js
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { getSortMapForModule } = require('../../utils/sort-utils');

const {
  fetchPaginatedProductBatchesService,
} = require('../../services/product-batch-service');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: Product Batches]');
  const startTime = Date.now();
  
  try {
    // ---------------------------------------------------------
    // Init shared caches
    // ---------------------------------------------------------
    await initStatusCache();
    
    console.log(`${logContext} 🚀 Starting product batch pagination test...\n`);
    
    // ------------------------------------------------------------
    // Step 1: Load test user (requester)
    // ------------------------------------------------------------
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
      // ['jp@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} ❌ Test user not found`);
      return;
    }
    
    const { id: userId, role_id: roleId } = rows[0];
    
    const authUser = {
      id: userId,
      role: roleId,
    };
    
    console.log(
      `${logContext} 👤 Loaded auth user: ${chalk.green(
        JSON.stringify(authUser)
      )}\n`
    );
    
    // ------------------------------------------------------------
    // Step 2: Sorting setup
    // ------------------------------------------------------------
    const sortMap = getSortMapForModule('productBatchSortMap');
    
    const logicalSortKey = 'expiryDate'; // try: createdAt, lotNumber
    const sortByColumn =
      sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    
    console.log(
      `${logContext} 🧮 Sorting by ${chalk.yellow(
        logicalSortKey
      )} → ${chalk.green(sortByColumn)}\n`
    );
    
    // ------------------------------------------------------------
    // Step 3: Filters & pagination
    // ------------------------------------------------------------
    const filters = {
      // skuIds: ['uuid'],
      // productIds: ['uuid'],
      // manufacturerIds: ['uuid'],
      // statusIds: ['uuid'],
      // lotNumber: 'LOT',
    };
    
    const pagination = { page: 1, limit: 25 };
    
    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();
    
    // ------------------------------------------------------------
    // Step 4: Execute product batch pagination service
    // ------------------------------------------------------------
    console.log(
      `${logContext} ▶️ Calling ${chalk.green(
        'fetchPaginatedProductBatchesService'
      )}...\n`
    );
    
    const result = await fetchPaginatedProductBatchesService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'ASC',
      user: authUser,
    });
    
    // ------------------------------------------------------------
    // Step 5: Display results
    // ------------------------------------------------------------
    const elapsedMs = Date.now() - startTime;
    const elapsedSec = (elapsedMs / 1000).toFixed(2);
    
    console.log(
      `${logContext} ✅ Completed in ${chalk.green(
        `${elapsedMs}ms`
      )} (${chalk.green(`${elapsedSec}s`)})\n`
    );
    
    console.log(`${logContext} 📄 Pagination Info:`);
    console.table(result.pagination);
    
    console.log(`\n${logContext} 🧾 First Row Preview:`);
    console.log(result.data?.[0] || chalk.yellow('No data'));
    
    console.log(`\n${logContext} 📜 Full JSON Output:`);
    console.log(chalk.gray(JSON.stringify(result, null, 2)));
    
    // ------------------------------------------------------------
    // Step 6: Table-style inspection
    // ------------------------------------------------------------
    console.log(`\n${logContext} 📊 Product Batch Table View`);
    
    if (result.data?.length > 0) {
      console.table(
        result.data.map((batch) => ({
          lot: batch.lotNumber,
          product: batch.product?.name ?? '-',
          sku: batch.sku?.code ?? '-',
          manufacturer: batch.manufacturer?.name ?? '-',
          expiry: batch.lifecycle.expiryDate,
          status: batch.status?.name,
          releasedBy: batch.releasedBy?.name ?? '-',
          releasedAt: batch.releasedAt ?? '-',
          createdAt: batch.audit?.createdAt ?? '-',
        }))
      );
    }
    
    console.log(
      `\n${logContext} 🎉 ${chalk.green(
        'Product batch pagination test completed successfully!'
      )}`
    );
  } catch (error) {
    console.error(`${logContext} ❌ ${chalk.red(error.message)}`);
    console.error(error.stack);
  } finally {
    client.release();
    setTimeout(() => process.exit(0), 100);
  }
})();
