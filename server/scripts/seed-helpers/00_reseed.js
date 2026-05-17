/**
 * @file scripts/<path>/reseedDatabase.js
 * @description
 * Maintenance script that fully reseeds the database: rolls back every
 * migration, reapplies them, then runs all seed files. Production is
 * hard-blocked; staging requires interactive confirmation; development
 * and test run unattended.
 *
 * Pattern notes:
 * - Infrastructure-level script, not part of the request lifecycle. Follows
 *   the same convention as the auth-infrastructure repositories and the
 *   companion `cleanTables` script: raw error handling with
 *   `logSystemException`, no `AppError`, no `handleDbError`. The script is
 *   itself the top-level error owner — single-log principle still applies.
 * - Functions return exit codes (Promise<number>); only the entry-point IIFE
 *   calls `process.exit`. This removes the need for a test-time `exitProcess`
 *   shim and keeps the exported functions composable.
 * - Knex lifecycle (knex.destroy) is owned by `startReseeding`, not by
 *   `reseedDatabase`, so `reseedDatabase` remains composable.
 * - The rollback / latest / seed steps are NOT wrapped in a single transaction:
 *   knex migrations manage their own transactions internally. A failure
 *   between rollback and latest leaves the DB partially migrated; re-running
 *   the script is the recovery path. This is an accepted limitation of knex
 *   migrations, not something this script tries to solve.
 *
 * Named exports:
 * - reseedDatabase(): Promise<number>
 * - startReseeding(): Promise<number>
 */

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const { loadEnv } = require('../../src/config/env');
const {
  logInfo,
  logSystemException,
} = require('../../src/utils/logging/logger-helper');

const { env } = loadEnv();
const knex = require('knex')(require('../../knexfile')[env]);

const CONTEXT = 'scripts/reseedDatabase';

/** Environments where reseed is permitted. */
const RESEEDABLE_ENVS = new Set(['development', 'test', 'staging']);

/**
 * Rolls back every migration, reapplies them, then runs all seed files.
 * Does NOT own the knex connection lifecycle — the caller is responsible
 * for destroying the pool.
 *
 * @returns {Promise<number>} 0 on success; 1 on a refused environment or
 *   any runtime failure.
 */
const reseedDatabase = async () => {
  const context = `${CONTEXT}/reseedDatabase`;
  
  // Hard guard. Reseed is destructive and irreversible, so a non-allowed
  // environment is treated as operator/config error: fail loud with exit 1
  // rather than silently skip. (The companion cleanTables script chose to
  // skip with 0 — the asymmetry is intentional given the risk profile.)
  if (!RESEEDABLE_ENVS.has(env)) {
    logSystemException(
      new Error(`Reseed refused: environment '${env}' is not reseedable.`),
      'Aborting reseed; non-reseedable environment.',
      { context, env }
    );
    return 1;
  }
  
  logInfo(`Starting reseed for environment: ${env}`, { context });
  
  try {
    // Each of the three steps below opens and commits its own transaction
    // internally (knex migration runner behavior). They cannot be wrapped
    // in a user-level transaction. A failure after rollback but before
    // latest leaves the DB partially migrated; re-running recovers.
    logInfo('Rolling back all migrations...', { context });
    await knex.migrate.rollback(null, true);
    
    logInfo('Reapplying migrations...', { context });
    await knex.migrate.latest();
    
    logInfo('Running seed files...', { context });
    await knex.seed.run();
    
    logInfo('Reseed completed successfully.', { context });
    return 0;
  } catch (err) {
    logSystemException(err, 'Reseed failed.', { context });
    return 1;
  }
};

/**
 * Script entry point. In staging, prompts the operator to confirm before
 * proceeding; in development and test, runs unattended. Owns the knex
 * connection lifecycle — destroys the pool in `finally` regardless of
 * outcome.
 *
 * @returns {Promise<number>} Process exit code (0 success, 1 failure).
 */
const startReseeding = async () => {
  const context = `${CONTEXT}/startReseeding`;
  
  try {
    if (env === 'staging') {
      const rl = readline.createInterface({ input, output });
      const answer = (
        await rl.question(
          'Are you sure you want to reseed the database in staging? (yes/no): '
        )
      )
        .trim()
        .toLowerCase();
      rl.close();
      
      if (answer !== 'yes') {
        logInfo('Reseed canceled by operator.', { context });
        return 0;
      }
    }
    
    return await reseedDatabase();
  } catch (err) {
    // Defensive: reseedDatabase already maps its own failures to exit codes,
    // so this only fires on unexpected errors in the prompt path itself.
    logSystemException(err, 'Unexpected error during reseed entry.', { context });
    return 1;
  } finally {
    await knex.destroy();
    logInfo('Knex connection destroyed.', { context });
  }
};

module.exports = { reseedDatabase, startReseeding };

// Direct-execution guard: only run when invoked as a script, not on import.
// Without this, requiring the module from a test file would kick off a reseed.
if (require.main === module) {
  (async () => {
    const exitCode = await startReseeding();
    process.exit(exitCode);
  })();
}
