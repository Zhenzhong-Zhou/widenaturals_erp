/**
 * @fileoverview
 * Manual test script for `getOrCreateBaseCodesBulk`.
 *
 * Purpose:
 *   - Verify base code lookup and creation workflow.
 *   - Validate deduplication of brand/category pairs before insert.
 *   - Validate upsert conflict handling (no duplicates on re-run).
 *   - Inspect DB changes and structured logs.
 *
 * Usage:
 *   node test-sku-base-codes.js
 */

'use strict';

const { performance } = require('perf_hooks');
const chalk           = require('chalk');
const { pool }        = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const { getOrCreateBaseCodesBulk } = require('../../services/sku-code-base-service');

(async () => {
  const logPrefix = chalk.cyan('[Test: SKU_BASE_CODES]');
  const startTime = performance.now();
  
  let client;
  
  try {
    console.log(`${logPrefix} 🚀 Starting SKU base code test...`);
    
    // ------------------------------------------------------------
    // 1. Connect to DB
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connection established.`);
    
    // ------------------------------------------------------------
    // 2. Load test user
    // ------------------------------------------------------------
    const { rows: users } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      ['root@widenaturals.com']
    );
    
    if (users.length === 0) {
      throw new Error('Test user root@widenaturals.com not found.');
    }
    
    const testUser = {
      id:     users[0].id,
      roleId: users[0].role_id,
    };
    
    console.log(
      `${logPrefix} 👤 Using test user: ${chalk.green(JSON.stringify(testUser))}`
    );
    
    // ------------------------------------------------------------
    // 3. Load a valid status ID for new base codes
    // ------------------------------------------------------------
    const { rows: statuses } = await client.query(
      `SELECT id, name FROM status WHERE name = 'active' LIMIT 1`
    );
    
    if (statuses.length === 0) {
      throw new Error('No active status found — cannot create base codes.');
    }
    
    const statusId = statuses[0].id;
    console.log(
      `${logPrefix} 🏷  Using status: ${chalk.green(statuses[0].name)} (${statusId})`
    );
    
    // ------------------------------------------------------------
    // 4. Snapshot current next_base before insert
    // ------------------------------------------------------------
    const { rows: beforeRows } = await client.query(
      `SELECT base_code FROM sku_code_bases ORDER BY base_code DESC LIMIT 1`
    );
    
    console.log(
      `${logPrefix} 📸 Current max base_code before insert: ${chalk.yellow(
        beforeRows[0]?.base_code ?? '(none)'
      )}`
    );
    
    // ------------------------------------------------------------
    // 5. Prepare brand/category pairs
    // ------------------------------------------------------------
    const pairs = [
      { brandCode: 'WN', categoryCode: 'VIT', statusId, userId: testUser.id },
      { brandCode: 'WN', categoryCode: 'MIN', statusId, userId: testUser.id },
      { brandCode: 'NF', categoryCode: 'VIT', statusId, userId: testUser.id },
      // Intentional duplicate — should be deduplicated before insert
      { brandCode: 'WN', categoryCode: 'VIT', statusId, userId: testUser.id },
    ];
    
    console.log(`${logPrefix} 📦 Prepared brand/category pairs (includes 1 duplicate)`);
    console.table(pairs.map((p) => ({
      brandCode:    p.brandCode,
      categoryCode: p.categoryCode,
    })));
    
    // ------------------------------------------------------------
    // 6. Call service — first run (expect inserts for new pairs)
    // ------------------------------------------------------------
    console.log(`${logPrefix} ▶️  Calling getOrCreateBaseCodesBulk (first run)...`);
    
    const resultMap = await getOrCreateBaseCodesBulk(pairs, client);
    
    if (!(resultMap instanceof Map) || resultMap.size === 0) {
      throw new Error('Service returned empty or invalid Map.');
    }
    
    console.log(`${logPrefix} ✅ Base codes resolved (first run)`);
    console.table(
      [...resultMap.entries()].map(([key, baseCode]) => ({ key, baseCode }))
    );
    
    // ------------------------------------------------------------
    // 7. Verify base codes in DB
    // ------------------------------------------------------------
    const brandCategoryPairs = [...resultMap.keys()].map((key) => {
      const [brandCode, categoryCode] = key.split('-');
      return { brandCode, categoryCode };
    });
    
    const { rows: dbRows } = await client.query(
      `
      SELECT brand_code, category_code, base_code, created_at
      FROM sku_code_bases
      WHERE (brand_code, category_code) IN (${brandCategoryPairs
        .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(', ')})
      ORDER BY base_code ASC
      `,
      brandCategoryPairs.flatMap((p) => [p.brandCode, p.categoryCode])
    );
    
    console.log(`${logPrefix} 🔎 Verified base codes in database`);
    console.table(dbRows);
    
    // ------------------------------------------------------------
    // 8. Second run — same pairs, expect no new inserts (upsert/idempotent)
    // ------------------------------------------------------------
    console.log(
      `${logPrefix} 🔁 Re-running same pairs to verify idempotency (upsert conflict handling)...`
    );
    
    const secondRunMap = await getOrCreateBaseCodesBulk(pairs, client);
    
    // Base codes must be identical across both runs
    let mismatch = false;
    for (const [key, baseCode] of resultMap.entries()) {
      if (secondRunMap.get(key) !== baseCode) {
        console.error(
          `${logPrefix} ❌ Mismatch on key "${key}": ` +
          `first=${baseCode}, second=${secondRunMap.get(key)}`
        );
        mismatch = true;
      }
    }
    
    if (!mismatch) {
      console.log(
        `${logPrefix} ✅ Upsert verified — base codes identical across both runs`
      );
    }
    
    // ------------------------------------------------------------
    // 9. Empty input guard
    // ------------------------------------------------------------
    console.log(`${logPrefix} 🧪 Testing empty input guard...`);
    
    const emptyResult = await getOrCreateBaseCodesBulk([], client);
    
    if (emptyResult instanceof Map && emptyResult.size === 0) {
      console.log(`${logPrefix} ✅ Empty input returned empty Map correctly`);
    } else {
      throw new Error('Empty input did not return an empty Map.');
    }
    
    // ------------------------------------------------------------
    // 10. Performance timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('SKU base code test completed', {
      context:        'test-sku-base-codes',
      resolvedCount:  resultMap.size,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱ Completed in ${chalk.green(`${elapsed}s`)}`);
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'SKU base code test failed', {
      context: 'test-sku-base-codes',
    });
    
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    console.log(`${logPrefix} 🧹 DB client released`);
    
    await pool.end().catch(() => {});
    console.log(`${logPrefix} 🏁 Pool closed`);
    
    process.exit(process.exitCode);
  }
})();
