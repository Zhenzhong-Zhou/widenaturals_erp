/**
 * @fileoverview
 * Manual test script for `fetchPaginatedSkuProductCardsService`.
 *
 * Tests:
 *   - ACL visibility rules
 *   - Filters, sorting, pagination
 *   - Transformer output correctness
 *   - Compliance + image + pricing integration
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const { fetchPaginatedSkuProductCardsService } = require('../../services/sku-service');
const { initStatusCache } = require('../../config/status-cache');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: SKU Product Cards]');
  const startTime = Date.now();
  
  try {
    console.log(`${logContext} 🚀 Starting SKU Product-Card pagination test...\n`);
    
    //
    // 0. Load status cache
    //
    await initStatusCache();
    
    //
    // 1. Load test user
    //
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(`${logContext} ❌ Test user not found`);
      return;
    }
    
    const testUser = {
      id: rows[0].id,
      role: rows[0].role_id,
    };
    
    console.log(`${logContext} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}\n`);
    
    //
    // 2. Sorting
    //
    const sortMap = getSortMapForModule('skuProductCards');
    const logicalSortKey = 'productName';
    
    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    
    console.log(`${logContext} 🔽 Sorting by: ${chalk.yellow(logicalSortKey)} → ${chalk.green(sortByColumn)}\n`);
    
    //
    // 3. Filters
    //
    const filters = {
      keyword: '80118579'
    };
    
    const pagination = { page: 1, limit: 10 };
    
    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();
    
    //
    // 4. Execute service
    //
    console.log(`${logContext} ▶️ Calling service...\n`);
    
    const result = await fetchPaginatedSkuProductCardsService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
      user: testUser,
    });
    
    //
    // 5. Benchmark
    //
    const elapsedMs = Date.now() - startTime;
    console.log(
      `${logContext} ⏱ Completed in ${chalk.green(`${elapsedMs}ms`)} (${chalk.green(
        (elapsedMs / 1000).toFixed(2) + 's'
      )})\n`
    );
    
    //
    // Pagination summary
    //
    console.log(`${logContext} 📄 Pagination Info:`);
    console.table(result.pagination);
    
    //
    // First row preview
    //
    console.log(`\n${logContext} 📦 First Row Preview:`);
    console.dir(result.data?.[0] || chalk.yellow('No data'), { depth: null });
    
    //
    // Full raw JSON result
    //
    console.log(`\n${logContext} 📜 Full JSON Output:`);
    console.log(chalk.gray(JSON.stringify(result, null, 2)));
    
    //
    // Pretty Table View — aligned with new transformer fields
    //
    console.log(`\n${logContext} 📊 SKU Product-Card Table View`);
    
    if (result.data?.length > 0) {
      console.table(
        result.data.map((card) => ({
          [chalk.green('product_name')]: card.displayName,
          [chalk.green('brand')]: card.brand,
          [chalk.green('series')]: card.series,
          [chalk.green('category')]: card.category,
          
          [chalk.yellow('status')]: typeof card.status === 'string'
            ? card.status
            : JSON.stringify(card.status),
          
          [chalk.magenta('sku')]: card.skuCode,
          [chalk.magenta('barcode')]: card.barcode,
          
          [chalk.cyan('msrp')]: card.price?.msrp ?? 'N/A',
          
          [chalk.gray('primary_image')]: card.image?.url || 'N/A',
          
          [chalk.blue('compliance_type')]: card.compliance?.type ?? 'N/A',
          [chalk.blue('compliance_number')]: card.compliance?.number ?? 'N/A',
        }))
      );
    } else {
      console.log(chalk.yellow(`${logContext} ⚠ No SKU product-cards available.`));
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
