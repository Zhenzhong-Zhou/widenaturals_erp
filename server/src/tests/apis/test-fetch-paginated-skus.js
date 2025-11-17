/**
 * @fileoverview
 * Manual test script for `fetchPaginatedSkusService`.
 *
 * Purpose:
 *   - Verify SKU pagination service end-to-end.
 *   - Validate filter + sort logic.
 *   - Inspect transformed results.
 *   - Benchmark performance.
 *
 * Usage:
 *   node test-paginated-skus.js
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const { fetchPaginatedSkusService } = require('../../services/sku-service');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: Paginated SKUs]');
  const startTime = Date.now();
  
  try {
    console.log(`${logContext} 🚀 Starting SKU pagination test...\n`);
    
    // ------------------------------------------------------------
    // Step 1: Load test user
    // ------------------------------------------------------------
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(
        `${logContext} ❌ ${chalk.red('Test user not found: root@widenaturals.com')}`
      );
      return;
    }
    
    const testUser = {
      id: rows[0].id,
      roleId: rows[0].role_id,
    };
    
    console.log(
      `${logContext} 👤 Loaded test user: ${chalk.green(
        JSON.stringify(testUser)
      )}\n`
    );
    
    // ------------------------------------------------------------
    // Step 2: Sorting setup
    // ------------------------------------------------------------
    const sortMap = getSortMapForModule('skuSortMap');
    const logicalSortKey = 'skuCode'; // try 'productName', 'brand', etc.
    
    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    
    console.log(
      `${logContext} 🧮 Sorting by ${chalk.yellow(logicalSortKey)} → ${chalk.green(
        sortByColumn
      )}\n`
    );
    
    // ------------------------------------------------------------
    // Step 3: Filters & pagination (customize as you like)
    // ------------------------------------------------------------
    const filters = {
      // brand: 'CANAHERB',
      // keyword: 'IMMUNE',
      // statusIds: ['uuid-status-example'],
      // productIds: ['uuid-product-example'],
    };
    
    const pagination = { page: 1, limit: 10 };
    
    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();
    
    // ------------------------------------------------------------
    // Step 4: Execute SKU pagination service
    // ------------------------------------------------------------
    console.log(
      `${logContext} ▶️ Calling ${chalk.green('fetchPaginatedSkusService')}...\n`
    );
    
    const result = await fetchPaginatedSkusService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
      user: testUser,
    });
    
    // ------------------------------------------------------------
    // Step 5: Display Results
    // ------------------------------------------------------------
    const elapsedMs = Date.now() - startTime;
    const elapsedSec = (elapsedMs / 1000).toFixed(2);
    
    console.log(
      `${logContext} ✅ Completed in ${chalk.green(`${elapsedMs}ms`)} (${chalk.green(
        `${elapsedSec}s`
      )})\n`
    );
    
    console.log(`${logContext} 📄 Pagination Info:`);
    console.table(result.pagination);
    
    console.log(`\n${logContext} 📦 First Row Preview:`);
    console.log(result.data?.[0] || chalk.yellow('No data'));
    
    console.log(`\n${logContext} 📜 Full JSON Output:`);
    console.log(chalk.gray(JSON.stringify(result, null, 2)));
    
    console.log(`\n${logContext} 📊 Full SKU Table View`);
    
    if (result.data?.length > 0) {
      console.table(
        result.data.map((sku) => ({
          // [chalk.cyan('SKU_ID')]: sku.id,
          // [chalk.cyan('Product_ID')]: sku.productId,
          
          [chalk.green('product_name')]: sku.product?.name,
          [chalk.green('series')]: sku.product?.series,
          [chalk.green('brand')]: sku.product?.brand,
          [chalk.green('category')]: sku.product?.category,
          
          [chalk.yellow('status_name')]: sku.status?.name,
          
          [chalk.magenta('sku')]: sku.sku,
          [chalk.magenta('barcode')]: sku.barcode,
          
          [chalk.blue('country_code')]: sku.countryCode,
          [chalk.blue('market_region')]: sku.marketRegion,
          [chalk.blue('size_label')]: sku.sizeLabel,
        }))
      );
    } else {
      console.log(chalk.yellow(`${logContext} ⚠ No SKUs available to display in table.`));
    }
    
    console.log(`\n${logContext} 🎉 ${chalk.green('Test completed successfully!')}`);
  } catch (error) {
    console.error(`${logContext} ❌ ${chalk.red(error.message)}`);
    console.error(error.stack);
  } finally {
    client.release();
    setTimeout(() => process.exit(0), 100);
  }
})();
