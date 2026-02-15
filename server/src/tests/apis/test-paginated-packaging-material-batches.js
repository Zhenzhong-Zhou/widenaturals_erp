/**
 * @fileoverview
 * Manual test script for `fetchPaginatedPackagingMaterialBatchesService`.
 *
 * Purpose:
 *   - Verify packaging material batch pagination end-to-end
 *   - Validate ACL-driven PMB visibility
 *   - Inspect transformed PMB rows
 *   - Validate snapshot identity, supplier joins, and lifecycle fields
 *
 * Usage:
 *   node test-paginated-packaging-material-batches.js
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { getSortMapForModule } = require('../../utils/sort-utils');

const {
  fetchPaginatedPackagingMaterialBatchesService,
} = require('../../services/packaging-material-batch-service');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: Packaging Material Batches]');
  const startTime = Date.now();

  try {
    // ---------------------------------------------------------
    // Init shared caches
    // ---------------------------------------------------------
    await initStatusCache();

    console.log(
      `${logContext} 🚀 Starting packaging material batch pagination test...\n`
    );

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
    const sortMap = getSortMapForModule('packagingMaterialBatchSortMap');

    const logicalSortKey = 'expiryDate'; // try: receivedAt, lotNumber, supplierName
    const sortByColumn = sortMap[logicalSortKey] || sortMap.defaultNaturalSort;

    console.log(
      `${logContext} 🧮 Sorting by ${chalk.yellow(
        logicalSortKey
      )} → ${chalk.green(sortByColumn)}\n`
    );

    // ------------------------------------------------------------
    // Step 3: Filters & pagination
    // ------------------------------------------------------------
    const filters = {
      // packagingMaterialIds: ['uuid'],
      supplierIds: ['e4748948-a6c4-43ab-a888-073aa7fed936'],
      // statusIds: ['uuid'],
      lotNumber: '112',
    };

    const pagination = { page: 1, limit: 25 };

    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();

    // ------------------------------------------------------------
    // Step 4: Execute PMB pagination service
    // ------------------------------------------------------------
    console.log(
      `${logContext} ▶️ Calling ${chalk.green(
        'fetchPaginatedPackagingMaterialBatchesService'
      )}...\n`
    );

    const result = await fetchPaginatedPackagingMaterialBatchesService({
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
    // Step 6: Table-style inspection (PMB-specific)
    // ------------------------------------------------------------
    console.log(`\n${logContext} 📊 Packaging Material Batch Table View`);

    if (result.data?.length > 0) {
      console.table(
        result.data.map((batch) => ({
          lot: batch.lotNumber,
          material: batch.material?.internalName ?? '-',
          supplierLabel: batch.material?.supplierLabel ?? '-',
          supplier: batch.supplier?.name ?? '-',
          qty: `${batch.quantity?.value ?? '-'} ${batch.quantity?.unit ?? ''}`,
          expiry: batch.lifecycle?.expiryDate ?? '-',
          receivedBy: batch.lifecycle?.receivedBy?.name ?? '-',
          receivedAt: batch.lifecycle?.receivedAt ?? '-',
          status: batch.status?.name,
          createdAt: batch.audit?.createdAt ?? '-',
        }))
      );
    }

    console.log(
      `\n${logContext} 🎉 ${chalk.green(
        'Packaging material batch pagination test completed successfully!'
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
