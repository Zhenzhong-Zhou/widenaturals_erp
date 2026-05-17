/**
 * @file scripts/<path>/cleanTables.js
 * @description
 * Maintenance script that TRUNCATEs a configurable set of tables with
 * RESTART IDENTITY CASCADE in development, test, and staging environments.
 * Production is hard-blocked; staging requires interactive confirmation.
 *
 * Pattern notes:
 * - This is infrastructure-level code, not part of the request lifecycle.
 *   It follows the same convention as the auth-infrastructure repositories:
 *   raw error handling with `logSystemException`, no `AppError`, no
 *   `handleDbError`. The script is itself the top-level error owner and
 *   logs once at this layer (single-log principle still applies).
 * - Lifecycle (knex.destroy) is owned by the entry point `startCleanup`,
 *   not by `cleanTables`, so `cleanTables` stays composable.
 *
 * Named exports:
 * - cleanTables(tableList): Promise<number>
 * - startCleanup(tableList): Promise<number>
 */

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const { loadEnv } = require('../../src/config/env');
const {
  logInfo,
  logWarn,
  logSystemException,
} = require('../../src/utils/logging/logger-helper');

const { env } = loadEnv();
const knex = require('knex')(require('../../knexfile')[env]);

const CONTEXT = 'scripts/cleanTables';

/** Environments where destructive cleanup is permitted. */
const DESTRUCTIVE_ENVS = new Set(['development', 'test', 'staging']);

/** Default table list used when this module is executed directly. */
const DEFAULT_TABLES = ['users', 'roles', 'permissions', 'status'];

/** Bare SQL identifier — fail-fast guard before SQL is built. */
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * TRUNCATEs the given tables with RESTART IDENTITY CASCADE inside a single
 * transaction. A single TRUNCATE statement is already atomic in PostgreSQL,
 * but the explicit transaction gives a clean rollback point in case CASCADE
 * side-effects ever surprise us.
 *
 * Does NOT own the knex connection lifecycle — the caller is responsible
 * for destroying the pool.
 *
 * @param {string[]} tableList - Plain table names. Each must match
 *   {@link IDENTIFIER_RE}; anything else is rejected before SQL is built.
 * @returns {Promise<number>} 0 on success or no-op skip; 1 on validation
 *   error or runtime failure.
 */
const cleanTables = async (tableList = []) => {
  const context = `${CONTEXT}/cleanTables`;
  
  // Hard guard: never truncate outside the allow-listed environments,
  // regardless of caller intent. This is the production safety net.
  if (!DESTRUCTIVE_ENVS.has(env)) {
    logWarn(`Skipping cleanup in '${env}' environment.`, { context });
    return 0;
  }
  
  if (tableList.length === 0) {
    logWarn('No tables specified for cleanup; nothing to do.', { context });
    return 1;
  }
  
  // Defense in depth: even though `??` will quote identifiers safely below,
  // reject obviously-malformed names early so a typo doesn't reach the DB.
  const invalid = tableList.filter((name) => !IDENTIFIER_RE.test(name));
  if (invalid.length > 0) {
    logSystemException(
      new Error(`Invalid table identifiers: ${invalid.join(', ')}`),
      'Aborting cleanup; invalid table names supplied.',
      { context, invalid }
    );
    return 1;
  }
  
  logInfo(`Starting cleanup for environment: ${env}`, {
    context,
    tables: tableList,
  });
  
  const trx = await knex.transaction();
  try {
    // `??` makes knex quote each identifier (e.g. "users") and protects
    // against injection if `tableList` ever becomes externally sourced.
    const placeholders = tableList.map(() => '??').join(', ');
    await trx.raw(
      `TRUNCATE TABLE ${placeholders} RESTART IDENTITY CASCADE`,
      tableList
    );
    
    await trx.commit();
    logInfo('Cleanup committed.', { context, tables: tableList });
    return 0;
  } catch (err) {
    await trx.rollback();
    logSystemException(err, 'Cleanup failed; transaction rolled back.', {
      context,
      tables: tableList,
    });
    return 1;
  }
};

/**
 * Script entry point. In staging, prompts the operator to confirm before
 * proceeding; in development and test, runs unattended. Owns the knex
 * connection lifecycle: the pool is destroyed in `finally` regardless of
 * outcome, so `cleanTables` can remain a composable building block.
 *
 * @param {string[]} [tableList=[]] - Tables to clean. Defaults to an empty
 *   list, which will short-circuit inside {@link cleanTables}.
 * @returns {Promise<number>} Process exit code (0 success, 1 failure).
 */
const startCleanup = async (tableList = []) => {
  const context = `${CONTEXT}/startCleanup`;
  
  try {
    // Staging is destructive-but-shared, so require a human in the loop.
    if (env === 'staging') {
      const rl = readline.createInterface({ input, output });
      const answer = (
        await rl.question(
          'Are you sure you want to clean up the database in staging? (yes/no): '
        )
      )
        .trim()
        .toLowerCase();
      rl.close();
      
      if (answer !== 'yes') {
        logInfo('Cleanup canceled by operator.', { context });
        return 0;
      }
    }
    
    return await cleanTables(tableList);
  } finally {
    await knex.destroy();
    logInfo('Knex connection destroyed.', { context });
  }
};

// Direct-execution guard: only run when invoked as a script, not on import.
if (require.main === module) {
  (async () => {
    const exitCode = await startCleanup(DEFAULT_TABLES);
    process.exit(exitCode);
  })();
}

module.exports = {
  cleanTables,
  startCleanup
};
