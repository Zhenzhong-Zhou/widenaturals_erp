/**
 * @fileoverview
 * Manual test script for `fetchPaginatedUsersService`.
 *
 * Purpose:
 *   - Verify user pagination service end-to-end
 *   - Validate filtering, sorting, and visibility enforcement
 *   - Inspect transformed list / card results
 *   - Benchmark performance
 *
 * Usage:
 *   node test-paginated-users.js
 */

const chalk = require('chalk');
const { pool } = require('../../database/db');
const { getSortMapForModule } = require('../../utils/sort-utils');
const { fetchPaginatedUsersService } = require('../../services/user-service');

(async () => {
  const client = await pool.connect();
  const logContext = chalk.cyan('[Test: Paginated Users]');
  const startTime = Date.now();
  
  try {
    console.log(`${logContext} 🚀 Starting user pagination test...\n`);
    
    // ------------------------------------------------------------
    // Step 1: Load test user (requester)
    // ------------------------------------------------------------
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1 LIMIT 1`,
      // ['root@widenaturals.com']
      ['jp@widenaturals.com']
    );
    
    if (rows.length === 0) {
      console.error(
        `${logContext} ❌ ${chalk.red('Test user not found')}`
      );
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
    const sortMap = getSortMapForModule('userSortMap');
    const logicalSortKey = 'createdAt'; // try: fullName, email, roleName, status
    
    const sortByColumn =
      sortMap[logicalSortKey] || sortMap.defaultNaturalSort;
    
    console.log(
      `${logContext} 🧮 Sorting by ${chalk.yellow(logicalSortKey)} → ${chalk.green(
        sortByColumn
      )}\n`
    );
    
    // ------------------------------------------------------------
    // Step 3: Filters & pagination
    // ------------------------------------------------------------
    const filters = {
      keyword: 'john',
      // roleIds: ['uuid-role-example'],
      // statusIds: ['uuid-status-example'],
    };
    
    const pagination = { page: 1, limit: 10 };
    // const viewMode = 'list'; // try: 'card'
    const viewMode = 'card'; // try: 'card'
    
    console.log(`${logContext} 🔍 Filters:`);
    console.table(filters);
    console.log();
    
    // ------------------------------------------------------------
    // Step 4: Execute user pagination service
    // ------------------------------------------------------------
    console.log(
      `${logContext} ▶️ Calling ${chalk.green('fetchPaginatedUsersService')}...\n`
    );
    
    const result = await fetchPaginatedUsersService({
      filters,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortByColumn,
      sortOrder: 'DESC',
      viewMode,
      user: authUser
    });
    
    // ------------------------------------------------------------
    // Step 5: Display results
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
    
    console.log(`\n${logContext} 👤 First Row Preview:`);
    console.log(result.data?.[0] || chalk.yellow('No data'));
    
    console.log(`\n${logContext} 📜 Full JSON Output:`);
    console.log(chalk.gray(JSON.stringify(result, null, 2)));
    
    console.log(`\n${logContext} 📊 User Table View`);
    
    if (result.data?.length > 0) {
      console.table(
        result.data.map((user) => {
          // ------------------------------
          // Card view (compact)
          // ------------------------------
          if (viewMode === 'card') {
            return {
              [chalk.green('full_name')]: user.fullName,
              [chalk.cyan('role')]: user.roleName,
              [chalk.blue('job_title')]: user.jobTitle,
            };
          }
          
          // ------------------------------
          // List view (full)
          // ------------------------------
          return {
            [chalk.green('full_name')]: user.fullName,
            [chalk.yellow('email')]: user.email,
            [chalk.cyan('role')]: user.roleName,
            [chalk.magenta('status')]: user.status?.name,
            [chalk.blue('job_title')]: user.jobTitle,
          };
        })
      );
    } else {
      console.log(
        chalk.yellow(`${logContext} ⚠ No users available to display.`)
      );
    }
    
    console.log(
      `\n${logContext} 🎉 ${chalk.green('User pagination test completed successfully!')}`
    );
  } catch (error) {
    console.error(`${logContext} ❌ ${chalk.red(error.message)}`);
    console.error(error.stack);
  } finally {
    client.release();
    setTimeout(() => process.exit(0), 100);
  }
})();
