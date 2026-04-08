/**
 * @fileoverview
 * Manual test script for `fetchBOMProductionSummaryService`.
 *
 * **Purpose:**
 *  - Execute the BOM Production Summary Service for validation and inspection.
 *  - Verify data transformation, shortage and bottleneck logic, and inactive stock handling.
 *  - Benchmark SQL join and transformation performance.
 *
 * **Usage:**
 *   node test-fetch-bom-details.js
 *
 * **Prerequisites:**
 *  - PostgreSQL instance seeded with sample BOM, parts, and packaging data.
 *  - A valid BOM ID with linked SKU, product, and material records.
 *  - A root/system user (e.g., `root@widenaturals.com`) must exist.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  fetchBOMProductionSummaryService,
} = require('../../services/bom-service');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');

(async () => {
  const logPrefix = chalk.cyan('[Test: BOM_PRODUCTION_SUMMARY]');
  const startTime = performance.now();
  let client;

  // ⏱️ Step timing helper
  const stepTime = (label, t0 = startTime) => {
    console.log(
      `${logPrefix} ⏲️ ${label}: ${((performance.now() - t0) / 1000).toFixed(3)}s`
    );
  };

  try {
    // ------------------------------------------------------------------------
    // 1. Initialize and connect to DB
    // ------------------------------------------------------------------------
    console.log(
      `${logPrefix} 🚀 Starting BOM Production Summary Service test...`
    );
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    stepTime('Database connected');

    // ------------------------------------------------------------------------
    // 2. Load test user
    // ------------------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    stepTime('Loaded test user');

    if (users.length === 0) {
      throw new Error('No test user found with email root@widenaturals.com');
    }

    const testUser = { id: users[0].id, roleId: users[0].role_id };
    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );

    // ------------------------------------------------------------------------
    // 3. Define test BOM ID
    // ------------------------------------------------------------------------
    const bomId = '61bb1f94-aeb2-4724-b9b8-35023b165fdd'; // ⚙️ Replace with valid BOM ID
    console.log(`${logPrefix} 🧩 Target BOM ID: ${chalk.yellow(bomId)}`);

    // ------------------------------------------------------------------------
    // 4. Execute Service
    // ------------------------------------------------------------------------
    console.log(`${logPrefix} ▶️ Calling fetchBOMProductionSummaryService...`);
    const result = await fetchBOMProductionSummaryService(bomId);
    stepTime('Service execution completed');

    // ------------------------------------------------------------------------
    // 5. Display and inspect results
    // ------------------------------------------------------------------------
    if (!result || typeof result !== 'object') {
      throw new Error(
        'Service returned unexpected result (null or invalid structure).'
      );
    }

    console.log(`${logPrefix} ✅ Service execution completed successfully.`);
    console.log(
      `${logPrefix} 📦 Parts in summary: ${chalk.green(result.parts?.length || 0)}`
    );

    // Display metadata overview
    console.log(chalk.bold(`\n${logPrefix} 🧠 Metadata Summary:`));
    console.table(result.metadata);

    // Optional deep inspection toggle
    const showFullDetails = true;
    if (showFullDetails) {
      console.log(chalk.bold(`\n${logPrefix} 🔍 Full Readiness Report:`));
      console.dir(result, { depth: null, colors: true });
    }

    // ------------------------------------------------------------------------
    // 6. Log timing and structured success
    // ------------------------------------------------------------------------
    const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(
      `${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsedSeconds}s`)}.`
    );
    stepTime('All steps completed');

    logSystemInfo(
      'BOM Production Summary Service test completed successfully',
      {
        context: 'test-fetch-bom-production-summary',
        severity: 'info',
        bomId,
        elapsedSeconds,
        partCount: result.parts?.length || 0,
        maxProducibleUnits: result.metadata?.maxProducibleUnits,
        shortageCount: result.metadata?.shortageCount,
        isReadyForProduction: result.metadata?.isReadyForProduction,
      }
    );

    process.exitCode = 0;
  } catch (error) {
    // ------------------------------------------------------------------------
    // Error handling and structured logging
    // ------------------------------------------------------------------------
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);

    logSystemException(
      error,
      'Manual test for fetchBOMProductionSummaryService failed',
      {
        context: 'test-fetch-bom-production-summary',
        severity: 'error',
        bomId: error?.bomId,
        originalError: error?.message,
      }
    );

    process.exitCode = 1;
  } finally {
    // ------------------------------------------------------------------------
    // 7. Cleanup
    // ------------------------------------------------------------------------
    if (client) {
      client.release();
      console.log(`${logPrefix} 🧹 DB client released.`);
    }

    await pool
      .end()
      .then(() => console.log(`${logPrefix} 🏁 Connection pool closed.`))
      .catch(() => console.warn(`${logPrefix} ⚠️ Failed to close pool.`));

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`${logPrefix} 🕒 Total elapsed: ${chalk.green(`${elapsed}s`)}`);
    process.exit(process.exitCode);
  }
})();
