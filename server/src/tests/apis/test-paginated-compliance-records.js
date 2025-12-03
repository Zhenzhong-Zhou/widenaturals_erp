/**
 * @fileoverview
 * Manual test script for `fetchPaginatedComplianceRecordsService`.
 *
 * Purpose:
 *   - Verify compliance record pagination service end-to-end.
 *   - Validate filter + sort logic.
 *   - Inspect transformed results.
 *   - Benchmark performance.
 *
 * Usage:
 *   node test-paginated-compliance-records.js
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const {
  fetchPaginatedComplianceRecordsService,
} = require('../../services/compliance-record-service');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: Paginated Compliance Records]');
  const startTime = Date.now();

  try {
    console.log(`${logContext} 🚀 Starting compliance pagination test...\n`);

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
    const sortMap = getSortMapForModule('complianceRecordSortMap');
    const logicalSortKey = 'expiryDate'; // try: 'issuedDate', 'type', 'status', 'skuCode'

    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;

    console.log(
      `${logContext} 🧮 Sorting by ${chalk.yellow(logicalSortKey)} → ${chalk.green(
        sortByColumn
      )}\n`
    );

    // ------------------------------------------------------------
    // Step 3: Filters & pagination
    // ------------------------------------------------------------
    const filters = {
      // skuIds: ['7080c9a5-ffd6-4921-a9b8-d0b004c3aef8'],
      // productIds: ['uuid-example-product'],
      // type: 'NPN',
      // statusIds: ['uuid-status'],
      keyword: 'IMMUNE',
      // region: 'CA',
    };

    const pagination = { page: 1, limit: 10 };

    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();

    // ------------------------------------------------------------
    // Step 4: Execute compliance pagination service
    // ------------------------------------------------------------
    console.log(
      `${logContext} ▶️ Calling ${chalk.green(
        'fetchPaginatedComplianceRecordsService'
      )}...\n`
    );

    const result = await fetchPaginatedComplianceRecordsService({
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

    // ------------------------------------------------------------
    // Table View
    // ------------------------------------------------------------
    console.log(`\n${logContext} 📊 Compliance Records Table View`);

    if (result.data?.length > 0) {
      console.table(
        result.data.map((rec) => ({
          [chalk.cyan('ID')]: rec.id,
          [chalk.green('Type')]: rec.type,
          [chalk.green('Doc No')]: rec.documentNumber,
          [chalk.yellow('Status')]: rec.status?.name,
          [chalk.blue('Issued')]: rec.issuedDate,
          [chalk.blue('Expiry')]: rec.expiryDate,

          [chalk.magenta('SKU Code')]: rec.sku?.sku,
          [chalk.magenta('Region')]: rec.sku?.marketRegion,
          [chalk.magenta('Size')]: rec.sku?.sizeLabel,

          [chalk.green('Product')]: rec.product?.name,
          [chalk.green('Brand')]: rec.product?.brand,
          [chalk.green('Series')]: rec.product?.series,

          [chalk.gray('Updated By')]: rec.audit?.updatedBy?.displayName || null,
        }))
      );
    } else {
      console.log(
        chalk.yellow(
          `${logContext} ⚠ No compliance records available to display.`
        )
      );
    }

    console.log(
      `\n${logContext} 🎉 ${chalk.green('Test completed successfully!')}`
    );
  } catch (error) {
    console.error(`${logContext} ❌ ${chalk.red(error.message)}`);
    console.error(error.stack);
  } finally {
    client.release();
    setTimeout(() => process.exit(0), 100);
  }
})();
