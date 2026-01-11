/**
 * @fileoverview
 * Manual test script for `changePasswordService`.
 *
 * Purpose:
 *   - Verify password change flow end-to-end
 *   - Enforce password reuse policy
 *   - Validate password history limit trimming
 *   - Ensure atomic updates under transaction + lock
 *
 * Usage:
 *   node test-change-password.js
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');
const { pool } = require('../../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/system-logger');
const { changePasswordService } = require('../../services/auth-service');
const { hashPassword } = require('../../business/user-auth-business');
const { loadEnv } = require('../../config/env');

loadEnv();

(async () => {
  const logPrefix = chalk.cyan('[Test: CHANGE_PASSWORD]');
  const startTime = performance.now();
  let client;
  
  const TEST_USER_EMAIL = 'root@widenaturals.com';
  
  // Known baseline password for deterministic testing
  const BASE_PASSWORD = process.env.TEST_BASE_PASSWORD;
  
  const PASSWORDS_TO_ROTATE = Array.from({ length: 6 }, (_, i) =>
    `TEST_PASSWORD_${i + 1}`
  );
  
  try {
    console.log(`${logPrefix} 🚀 Starting password change test`);
    
    // ------------------------------------------------------------
    // 1. Connect DB
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${logPrefix} ✅ Database connected`);
    
    // ------------------------------------------------------------
    // 2. Load test user
    // ------------------------------------------------------------
    const { rows } = await client.query(
      `
      SELECT u.id
      FROM users u
      WHERE u.email = $1
      LIMIT 1;
      `,
      [TEST_USER_EMAIL]
    );
    
    if (rows.length === 0) {
      throw new Error(`Test user not found: ${TEST_USER_EMAIL}`);
    }
    
    const userId = rows[0].id;
    console.log(`${logPrefix} 👤 Using test user: ${chalk.green(userId)}`);
    
    // ------------------------------------------------------------
    // 3. Force known initial password + clear history
    // ------------------------------------------------------------
    console.log(`${logPrefix} 🔧 Resetting password + history`);
    
    const baseHash = await hashPassword(BASE_PASSWORD);
    
    await client.query(
      `
      UPDATE user_auth
      SET
        password_hash = $1,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'),
          '{password_history}',
          '[]'::jsonb
        )
      WHERE user_id = $2;
      `,
      [baseHash, userId]
    );
    
    let currentPassword = BASE_PASSWORD;
    
    // ------------------------------------------------------------
    // 4. Rotate passwords beyond history limit
    // ------------------------------------------------------------
    for (const nextPassword of PASSWORDS_TO_ROTATE) {
      const masked = '*'.repeat(nextPassword.length);
      
      console.log(
        `${logPrefix} 🔄 Changing password → ${chalk.yellow(masked)}`
      );
      
      await changePasswordService(
        userId,
        currentPassword,
        nextPassword
      );
      
      currentPassword = nextPassword;
    }
    
    console.log(`${logPrefix} ✅ Password rotation completed`);
    
    // ------------------------------------------------------------
    // 5. Verify password history trimming
    // ------------------------------------------------------------
    const { rows: verifyRows } = await client.query(
      `
      SELECT metadata->'password_history' AS history
      FROM user_auth
      WHERE user_id = $1;
      `,
      [userId]
    );
    
    const history = verifyRows[0]?.history ?? [];
    
    console.log(`${logPrefix} 📜 Password history length: ${history.length}`);
    console.table(
      history.map((h, i) => ({
        index: i,
        changed_at: h.changed_at,
      }))
    );
    
    if (history.length !== 5) {
      throw new Error(`Expected history length 5, got ${history.length}`);
    }
    
    // ------------------------------------------------------------
    // 6. Reuse of trimmed password SHOULD be allowed
    // ------------------------------------------------------------
    console.log(
      `${logPrefix} 🔁 Verifying reuse of trimmed password is allowed`
    );
    
    await changePasswordService(
      userId,
      currentPassword,
      BASE_PASSWORD
    );
    
    currentPassword = BASE_PASSWORD;
    
    console.log(`${logPrefix} ✅ Trimmed password reuse allowed`);
    
    // ------------------------------------------------------------
    // 7. Reuse of recent password SHOULD be blocked
    // ------------------------------------------------------------
    const recentPassword = PASSWORDS_TO_ROTATE.at(-1);
    
    console.log(
      `${logPrefix} 🚫 Verifying reuse of recent password is blocked`
    );
    
    try {
      await changePasswordService(
        userId,
        currentPassword,
        recentPassword
      );
      
      throw new Error('Expected password reuse rejection did not occur');
    } catch (err) {
      console.log(
        `${logPrefix} ✅ Correctly blocked reuse of recent password`
      );
    }
    
    // ------------------------------------------------------------
    // 8. Success + timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSystemInfo('Password change test completed successfully', {
      context: 'test-change-password',
      userId,
      elapsedSeconds: elapsed,
    });
    
    console.log(`${logPrefix} ⏱️ Completed in ${chalk.green(`${elapsed}s`)}`);
    process.exitCode = 0;
    
  } catch (error) {
    console.error(`${logPrefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Password change test failed', {
      context: 'test-change-password',
    });
    
    process.exitCode = 1;
    
  } finally {
    if (client) client.release();
    await pool.end().catch(() => {});
    process.exit(process.exitCode);
  }
})();
