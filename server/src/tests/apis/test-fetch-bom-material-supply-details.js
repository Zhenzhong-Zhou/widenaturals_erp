/**
 * @fileoverview
 * Manual test script for `fetchBomMaterialSupplyDetailsService`.
 *
 * Purpose:
 *   - Execute the BOM Material Supply Details Service for deep inspection
 *   - Validate data transformation, exchange rate handling, and variance logic
 *   - Benchmark SQL join + transformation performance
 *
 * Usage:
 *   node test-fetch-bom-details.js
 *
 * Prerequisites:
 *   - PostgreSQL running and seeded with sample BOM, parts, and packaging data
 *   - A valid BOM ID exists (with related SKU, product, and item materials)
 *   - A system/root user exists (e.g. root@widenaturals.com)
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  fetchBomMaterialSupplyDetailsService,
} = require('../../services/bom-item-service');
const {
  logSystemException,
  logSystemInfo,
} = require('../../utils/logging/system-logger');

(async () => {
  const logPrefix = chalk.cyan('[Test: BOM_DETAILS]');
  const startTime = performance.now();
  let client;

  try {
    console.log(`${logPrefix} 🚀 Starting BOM Material Supply Details test...`);

    // --- Step 1: Connect to DB ---
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);

    // --- Step 2: Load test user ---
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );

    if (users.length === 0) {
      throw new Error('No test user found with email root@widenaturals.com');
    }

    const testUser = { id: users[0].id, roleId: users[0].role_id };
    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );

    // --- Step 3: Define test BOM ID ---
    const bomId = 'a1a654fb-cb9a-4fd8-9de4-e3aa4546fe84'; // ⚙️ Replace with valid BOM ID
    console.log(
      `${logPrefix} 🧩 Fetching BOM Details for ID: ${chalk.yellow(bomId)}`
    );

    // --- Step 4: Execute service ---
    console.log(
      `${logPrefix} ▶️ Calling fetchBomMaterialSupplyDetailsService...`
    );
    const result = await fetchBomMaterialSupplyDetailsService(bomId);

    if (!result || !Array.isArray(result)) {
      throw new Error(
        'Service returned unexpected result (null or invalid structure).'
      );
    }

    // --- Step 5: Display result summary ---
    console.log(`${logPrefix} ✅ Service execution completed successfully.\n`);

    // Calculate high-level summary
    const summary = result.summary || {};
    console.log(chalk.bold(`${logPrefix} 💰 BOM Cost Summary:`));
    console.table({
      TotalEstimatedCost: summary.totalEstimatedCost ?? '—',
      TotalActualCost: summary.totalActualCost ?? '—',
      Variance: summary.variance ?? '—',
      VariancePercentage: `${summary.variancePercentage ?? '—'}%`,
      BaseCurrency: summary.baseCurrency ?? '—',
    });

    // Show BOM item count
    console.log(
      `${logPrefix} 🧱 Total BOM Items: ${chalk.green(result.length)}`
    );

    // Show a compact per-item cost breakdown
    console.log(chalk.bold(`${logPrefix} 🧾 BOM Item Breakdown:`));
    result.forEach((item, i) => {
      console.log(
        `  ${chalk.yellow(i + 1)}. ${item.part?.name || 'Unknown'} — ${item.packagingMaterials?.length || 0} materials`
      );
    });

    // --- Optional: Deep inspection (toggleable) ---
    const showFullDetails = true; // 👈 Toggle this if you want the deep view
    if (showFullDetails) {
      console.log(chalk.bold(`\n${logPrefix} 🪶 Full Object (Deep View):`));
      console.dir(result, { depth: null, colors: true });
    }

    // --- Step 6: Log timing ---
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}.`);

    // Log structured success
    logSystemInfo('BOM Material Supply Details test completed successfully', {
      context: 'test-fetch-bom-details',
      bomId,
      elapsedSeconds: elapsed,
      recordCount: result?.length || 0,
    });

    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    logSystemException(
      error,
      'Manual test for fetchBomMaterialSupplyDetailsService failed',
      {
        context: 'test-fetch-bom-details',
        severity: 'error',
      }
    );
    process.exitCode = 1;
  } finally {
    // --- Step 7: Cleanup ---
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released.`);
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed.`);
    process.exit(process.exitCode);
  }
})();
