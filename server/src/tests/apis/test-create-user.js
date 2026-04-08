/**
 * @fileoverview
 * Manual test script for `createUserService`.
 *
 * Purpose:
 *   - Execute and verify user creation end-to-end.
 *   - Validate service-layer ACL, status assignment, hashing, and transaction flow.
 *   - Confirm both `users` and `user_auth` inserts succeed atomically.
 *   - Inspect DB output and system logs.
 *
 * Usage:
 *   node test-create-user.js
 *
 * Prerequisites:
 *   - PostgreSQL database is running.
 *   - `users`, `user_auth`, `roles`, and status tables are ready.
 *   - Status cache initialized or init function available.
 *   - A valid actor user exists (e.g. root@widenaturals.com).
 *   - Target role exists and is active.
 */

const { performance } = require('perf_hooks');
const chalk = require('chalk');

const { pool } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const { createUserService } = require('../../services/user-service');

const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');

(async () => {
  const prefix = chalk.cyan('[Test: CREATE_USER]');
  const start = performance.now();
  let client;
  let createdUserId = null;
  
  try {
    console.log(`${prefix} 🚀 Starting create user test...`);
    
    // ------------------------------------------------------------
    // Step 1: DB Connection
    // ------------------------------------------------------------
    client = await pool.connect();
    console.log(`${prefix} ✅ Connected to database.`);
    
    await initStatusCache();
    console.log(`${prefix} ✅ Status cache initialized.`);
    
    // ------------------------------------------------------------
    // Step 2: Load Actor
    // ------------------------------------------------------------
    const { rows: actorRows } = await client.query(
      `
      SELECT id, role_id
      FROM users
      WHERE email = $1
      LIMIT 1;
      `,
      ['root@widenaturals.com']
    );
    console.log(">>>>>", actorRows)
    if (actorRows.length === 0) {
      throw new Error('Actor not found: root@widenaturals.com');
    }
    
    const actor = {
      id: actorRows[0].id,
      role: actorRows[0].role_id,
      isRoot: true,         // adjust if your ACL resolver derives this elsewhere
      isBootstrap: false,   // normal API path test
    };
    
    console.log(`${prefix} 👤 Using actor: ${chalk.green(actor.email)}`);
    
    // ------------------------------------------------------------
    // Step 3: Load Target Role
    // Choose an active role that should be allowed by your ACL.
    // ------------------------------------------------------------
    const { rows: roleRows } = await client.query(
      `
      SELECT id, name, is_active
      FROM roles
      WHERE is_active = true
        AND LOWER(name) NOT IN ('root', 'system')
      ORDER BY name
      LIMIT 1;
      `
    );
    
    if (roleRows.length === 0) {
      throw new Error('No valid active target role found for test.');
    }
    
    const targetRole = roleRows[0];
    
    console.log(
      `${prefix} 🎯 Using target role: ${chalk.green(targetRole.name)} (${targetRole.id})`
    );
    
    // ------------------------------------------------------------
    // Step 4: Prepare Input
    // Use a unique email for repeatable testing.
    // ------------------------------------------------------------
    const timestamp = Date.now();
    
    const input = {
      email: `test.user.${timestamp}@example.com`,
      password: 'TestPassword123!',
      roleId: targetRole.id,
      firstname: 'Test',
      lastname: 'User',
      phoneNumber: null,
      jobTitle: 'QA Tester',
      note: 'Manual test for createUserService',
    };
    
    console.log(`${prefix} 🧾 Prepared input:`);
    console.table([
      {
        email: input.email,
        roleId: input.roleId,
        firstname: input.firstname,
        lastname: input.lastname,
        jobTitle: input.jobTitle,
      },
    ]);
    
    // ------------------------------------------------------------
    // Step 5: Execute Service
    // ------------------------------------------------------------
    console.log(`${prefix} ▶️ Calling createUserService...`);
    
    const createdUser = await createUserService(input, actor);
    
    if (!createdUser || !createdUser.id) {
      throw new Error('Service returned invalid user result.');
    }
    
    createdUserId = createdUser.id;
    
    console.log(`${prefix} ✅ User created successfully:`);
    console.table([createdUser]);
    
    // ------------------------------------------------------------
    // Step 6: Verify users row
    // ------------------------------------------------------------
    const { rows: userRows } = await client.query(
      `
      SELECT
        id,
        email,
        role_id,
        status_id,
        firstname,
        lastname,
        phone_number,
        job_title,
        note,
        created_by,
        updated_by,
        updated_at,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1;
      `,
      [createdUserId]
    );
    
    if (userRows.length === 0) {
      throw new Error('Inserted user not found in users table.');
    }
    
    console.log(`${prefix} 🔎 Verified users row:`);
    console.table(userRows);
    
    // ------------------------------------------------------------
    // Step 7: Verify user_auth row
    // ------------------------------------------------------------
    const { rows: authRows } = await client.query(
      `
      SELECT
        user_id,
        password_hash,
        created_at
      FROM user_auth
      WHERE user_id = $1
      LIMIT 1;
      `,
      [createdUserId]
    );
    
    if (authRows.length === 0) {
      throw new Error('Inserted auth record not found in user_auth table.');
    }
    
    console.log(`${prefix} 🔐 Verified user_auth row:`);
    console.table(
      authRows.map((row) => ({
        user_id: row.user_id,
        has_password_hash: !!row.password_hash,
        created_at: row.created_at,
      }))
    );
    
    // ------------------------------------------------------------
    // Step 8: Assertions
    // ------------------------------------------------------------
    if (userRows[0].email !== input.email) {
      throw new Error('Email mismatch in users table.');
    }
    
    if (userRows[0].role_id !== input.roleId) {
      throw new Error('Role mismatch in users table.');
    }
    
    if (!authRows[0].password_hash) {
      throw new Error('Password hash missing in user_auth table.');
    }
    
    // ------------------------------------------------------------
    // Step 9: Timing
    // ------------------------------------------------------------
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    
    console.log(
      `${prefix} ⏱️ Test completed in ${chalk.green(`${elapsed}s`)}.`
    );
    
    logSystemInfo('Create user test completed successfully', {
      context: 'test-create-user',
      createdUserId,
      actorId: actor.id,
      targetRoleId: input.roleId,
      elapsedSeconds: elapsed,
    });
    
    process.exitCode = 0;
  } catch (error) {
    console.error(`${prefix} ❌ Error: ${chalk.red(error.message)}`);
    
    logSystemException(error, 'Manual test for createUserService failed', {
      context: 'test-create-user',
      createdUserId,
    });
    
    process.exitCode = 1;
  } finally {
    try {
      // ----------------------------------------------------------
      // Optional cleanup for repeatable tests
      // ----------------------------------------------------------
      if (createdUserId) {
        await client.query('DELETE FROM user_auth WHERE user_id = $1', [createdUserId]);
        await client.query('DELETE FROM users WHERE id = $1', [createdUserId]);
        console.log(`${prefix} 🧹 Cleanup completed for user ${createdUserId}.`);
      }
    } catch (cleanupError) {
      console.error(`${prefix} ⚠️ Cleanup failed: ${cleanupError.message}`);
    }
    
    if (client) client.release();
    console.log(`${prefix} 🧹 DB client released.`);
    
    await pool.end().catch(() => {});
    console.log(`${prefix} 🏁 Pool closed.`);
    
    process.exit(process.exitCode);
  }
})();
