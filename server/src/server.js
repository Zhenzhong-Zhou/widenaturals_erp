/**
 * @file server.js
 * @description Application bootstrap — startup pipeline only.
 *
 * Responsibilities:
 *   - Validate required environment variables before any I/O
 *   - Run each startup step in dependency order via `runStartupStep`
 *   - Register runtime services (health check, pool monitor, backup scheduler)
 *   - Register corresponding shutdown hooks so each service is stopped cleanly
 *
 * Non-responsibilities (handled elsewhere):
 *   - Graceful shutdown logic  → system/lifecycle/on-exit
 *   - Express app definition   → app.js
 *   - Individual startup steps → system/startup/*
 *
 * Startup order:
 *   1. Database
 *   2. Caches          (depend on DB)
 *   3. Root admin      (depends on DB + caches)
 *   4. HTTP server     (created but not yet listening)
 *   5. Health check    (runtime service)
 *   6. Pool monitor    (runtime service)
 *   7. HTTP listen     (accepts traffic only after all services are ready)
 *   8. Backup schedule (lowest priority; loss is recoverable)
 */

'use strict';

const http = require('http');

// Logging utilities
const {
  logSystemInfo,
  logSystemException,
  logMissingEnvVar,
} = require('./utils/logging/system-logger');

// Core helpers
const AppError = require('./utils/AppError');
const { runStartupStep } = require('./system/lifecycle/run-startup-step');
const {
  setServer,
  registerShutdownHook,
} = require('./system/lifecycle/on-exit');

// Application
const app = require('./app');

// Startup initializers
const {
  createDatabaseAndInitialize,
} = require('./system/startup/initialize-database');
const { initializeRootAdmin } = require('./config/initialize-root');

// Cache initializers
const { initAllStatusCaches } = require('./config/status-cache');
const {
  initSkuOperationalStatusCache,
} = require('./config/sku-operational-status-cache');
const {
  initBatchActivityTypeCache,
} = require('./cache/batch-activity-type-cache');

// Runtime services
const { monitorPool } = require('./database/db');
const {
  startPoolMonitoring,
  stopPoolMonitoring,
} = require('./system/monitoring/pool-monitor');
const {
  startHealthCheck,
  stopHealthCheck,
} = require('./system/health/health-check');

// Backup
const { runBackup } = require('./system/backup/jobs/run-backup');
const {
  startBackupScheduler,
  stopBackupScheduler,
} = require('./system/backup/jobs/backup-scheduler');

// Constants
const { ONE_MINUTE } = require('./utils/constants/general/time');

// ---------------------------------------------------------------------------
// Conditional imports — resolved at module load, not inside callbacks
// ---------------------------------------------------------------------------

// Only import cron setup when it will actually be used, but do it up front so
// dynamic require() calls don't hide dependency errors until runtime.
const cronSetup =
  process.env.USE_CRON_BACKUP === 'true' ? require('./tasks/cron-setup') : null;

// ---------------------------------------------------------------------------

const CONTEXT = 'startup/server';

/**
 * Starts the application server by running each initialization step in order.
 *
 * Steps are intentionally sequential: later steps depend on earlier ones
 * (e.g. caches require the DB, root admin requires caches). `runStartupStep`
 * wraps each step with structured logging and error propagation so a failure
 * in any step aborts startup with a clear log entry.
 *
 * Shutdown hooks are registered inline, next to the service they belong to,
 * so the start/stop pair is easy to audit and keep in sync.
 *
 * @async
 * @returns {Promise<http.Server>} The listening HTTP server instance.
 * @throws {AppError} If PORT is missing or any startup step throws.
 */
const startServer = async () => {
  // ---------------------------------------------------------------------------
  // Validate environment — fail fast before any I/O
  // ---------------------------------------------------------------------------
  const PORT = process.env.PORT;

  if (!PORT) {
    const error = new AppError('PORT environment variable is missing');
    logMissingEnvVar('PORT', error);
    throw error;
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Database
    // Must succeed before caches or admin init, both of which query the DB.
    // -------------------------------------------------------------------------
    await runStartupStep('Initialize database', createDatabaseAndInitialize, {
      context: CONTEXT,
    });

    // -------------------------------------------------------------------------
    // 2. Caches
    // Populated from DB rows; grouped into one step to keep startup logs clean.
    // -------------------------------------------------------------------------
    await runStartupStep(
      'Initialize caches',
      async () => {
        await initAllStatusCaches();
        await initSkuOperationalStatusCache();
        await initBatchActivityTypeCache();
      },
      { context: CONTEXT }
    );

    // -------------------------------------------------------------------------
    // 3. Root admin
    // Upserts the built-in admin account; safe to re-run on every boot.
    // -------------------------------------------------------------------------
    await runStartupStep('Initialize root admin', initializeRootAdmin, {
      context: CONTEXT,
    });

    // -------------------------------------------------------------------------
    // 4. Create HTTP server (not yet listening)
    // Server is registered with the lifecycle module here so that on-exit can
    // call server.close() even if the listen step below never completes.
    // -------------------------------------------------------------------------
    let server;

    await runStartupStep(
      'Create HTTP server',
      () => {
        server = http.createServer(app);
        setServer(server);
      },
      { context: CONTEXT }
    );

    // -------------------------------------------------------------------------
    // 5. Health check
    // Registered before the server starts listening so the endpoint is ready
    // the moment the first request arrives.
    // -------------------------------------------------------------------------
    await runStartupStep(
      'Start health check',
      () => {
        const interval =
          parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || ONE_MINUTE;

        startHealthCheck(interval);
        registerShutdownHook(() => stopHealthCheck());
      },
      { context: CONTEXT }
    );

    // -------------------------------------------------------------------------
    // 6. Pool monitor
    // Logs DB connection-pool saturation at a fixed cadence; purely observational.
    // -------------------------------------------------------------------------
    await runStartupStep(
      'Start pool monitor',
      () => {
        startPoolMonitoring(monitorPool);
        registerShutdownHook(() => stopPoolMonitoring());
      },
      { context: CONTEXT }
    );

    // -------------------------------------------------------------------------
    // 7. Start listening
    // Traffic is accepted only after all services above are ready.
    // -------------------------------------------------------------------------
    await runStartupStep(
      'Start HTTP server',
      () =>
        new Promise((resolve) => {
          server.listen(PORT, () => {
            logSystemInfo(`Server running at http://localhost:${PORT}`, {
              context: CONTEXT,
              port: PORT,
            });
            resolve();
          });
        }),
      { context: CONTEXT }
    );

    // -------------------------------------------------------------------------
    // 8. Backup schedule (lowest priority — a failure here is recoverable)
    //
    // Two modes:
    //   USE_CRON_BACKUP=true  → delegate to OS-level cron (setupCronJobs)
    //   USE_CRON_BACKUP=false → use the in-process scheduler
    //
    // In-process mode runs a final backup on shutdown so the last state is
    // always captured even if the scheduler hasn't fired recently.
    // -------------------------------------------------------------------------
    await runStartupStep(
      'Start backup schedule',
      () => {
        if (cronSetup) {
          cronSetup.setupCronJobs();
        } else {
          startBackupScheduler();

          registerShutdownHook(async () => {
            // Stop the scheduler before the final backup to avoid a race
            // between a scheduled run and this explicit shutdown run.
            stopBackupScheduler();

            try {
              await runBackup();
            } catch (error) {
              // Log but don't rethrow — a failed final backup should not
              // prevent the process from exiting cleanly.
              logSystemException(error, 'Final backup failed on shutdown', {
                context: CONTEXT,
              });
            }
          });
        }
      },
      { context: CONTEXT }
    );

    return server;
  } catch (error) {
    logSystemException(error, 'Failed to start server', { context: CONTEXT });
    throw error;
  }
};

module.exports = {
  startServer,
};
