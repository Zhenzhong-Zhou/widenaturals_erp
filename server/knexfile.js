/**
 * @file knexfile.js
 * @description Knex.js CLI configuration for database migrations and seeds.
 *
 * Exports four environment-keyed configs: `development`, `test`, `staging`,
 * `production`. Each is an `import('knex').Knex.Config` object built by
 * {@link buildEnvConfig}.
 *
 * Consumed by the `knex` CLI (not by the application runtime). Migration
 * and seed commands resolve their config from this file. Connection and
 * pool settings are read from the same modules used by the running server
 * so CLI operations and the running application agree on how to reach the
 * database.
 *
 * --- Migrations ---
 * A single migrations directory is shared across every environment. The
 * schema must migrate forward identically in development, test, staging,
 * and production; per-environment migrations would defeat their purpose.
 *
 * --- Seeds ---
 * Seeds are split into categorized subdirectories under `src/database/seeds`:
 *
 *   01_reference  Lookup tables (status, roles, types, methods, permissions).
 *                 Runs first; has no dependencies on business data.
 *   02_core       Business data (system user, products, customers, batches).
 *                 Depends on reference data being populated.
 *
 * The `01_` / `02_` numeric folder prefix is intentional and load-bearing:
 * Knex sorts seed files by full path, not basename, so without these
 * prefixes "core/" would lexicographically precede "reference/" and seeds
 * would execute in the wrong dependency order — silently failing with FK
 * violations or NULL constraint errors on the second-run-after-reset.
 *
 * --- Environment loading ---
 * `loadEnv()` is invoked at module load because the Knex CLI bypasses the
 * application's normal startup path and therefore does not pre-populate
 * `process.env`. Both `getConnectionConfig` and `getPoolConfig` rely on
 * env vars being present.
 *
 * @example
 * # Run migrations using the current NODE_ENV (defaults to "development")
 * npx knex migrate:latest
 *
 * # Roll back the latest migration in production
 * NODE_ENV=production npx knex migrate:rollback
 *
 * # Seed the database against staging
 * NODE_ENV=staging npx knex seed:run
 *
 */

'use strict';

const path = require('path');
const { loadEnv } = require('./src/config/env');
const {
  getPoolConfig,
  getConnectionConfig,
} = require('./src/config/db-config');

// The Knex CLI does not load env vars on its own. Load them now, before
// any code below reads from process.env.
loadEnv();

// ─────────────────────────────────────────────────────────────────────────
// Paths
// ─────────────────────────────────────────────────────────────────────────

/**
 * Absolute path to the single shared migrations directory.
 *
 * @type {string}
 */
const MIGRATIONS_DIR = path.resolve(__dirname, './src/database/migrations');

/**
 * Absolute path to the root seeds directory. Seed category folders live
 * directly under this path (e.g. `01_reference/`, `02_core/`).
 *
 * @type {string}
 */
const SEEDS_ROOT = path.resolve(__dirname, './src/database/seeds');

/**
 * Resolves an absolute path for a seed category subdirectory.
 *
 * @param {string} category - Category folder name with its order prefix
 *   (e.g. `'01_reference'`, `'02_core'`).
 * @returns {string} Absolute path to the category directory.
 */
const seedDir = (category) => path.join(SEEDS_ROOT, category);

/**
 * Seed directories Knex will execute, in their intended execution order.
 *
 * Knex sorts seed files by full path across all configured directories.
 * The numeric folder prefixes guarantee that every reference seed runs
 * before any core seed, regardless of the file numbering inside each
 * folder.
 *
 * @type {string[]}
 */
const SEED_DIRECTORIES = [seedDir('01_reference'), seedDir('02_core')];

// ─────────────────────────────────────────────────────────────────────────
// Per-environment config
// ─────────────────────────────────────────────────────────────────────────

/**
 * Builds a Knex configuration object for one environment.
 *
 * `getConnectionConfig` and `getPoolConfig` are invoked fresh on each call
 * so each environment receives its own distinct config object instance.
 * The underlying values are identical today, but distinct instances
 * prevent any future per-environment override from accidentally mutating
 * a shared reference — a class of bug that's hard to debug if it ever
 * arises.
 *
 * The `_env` parameter is currently unused. It exists to support future
 * per-environment overrides (e.g. enabling `disableTransactions` for test
 * only, or pointing test seeds at a fixtures directory) without changing
 * the call signature.
 *
 * @param {'development'|'test'|'staging'|'production'} _env
 *   Reserved for future per-environment overrides.
 * @returns {import('knex').Knex.Config}
 */
const buildEnvConfig = (_env) => ({
  client: 'postgresql',
  connection: getConnectionConfig(),
  pool: getPoolConfig(),
  migrations: {
    directory: MIGRATIONS_DIR,
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: SEED_DIRECTORIES,
  },
});

/**
 * Knex configurations keyed by environment.
 *
 * @type {{
 *   development: import('knex').Knex.Config,
 *   test:        import('knex').Knex.Config,
 *   staging:     import('knex').Knex.Config,
 *   production:  import('knex').Knex.Config,
 * }}
 */
module.exports = {
  development: buildEnvConfig('development'),
  test: buildEnvConfig('test'),
  staging: buildEnvConfig('staging'),
  production: buildEnvConfig('production'),
};
