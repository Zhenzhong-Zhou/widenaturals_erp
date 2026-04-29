const fs = require('node:fs/promises');
const path = require('node:path');
const {
  logSystemInfo,
  logSystemWarn,
  logSystemException,
} = require('../../../utils/logging/system-logger');
const { backupDatabase } = require('../backup-database');

const CONTEXT = 'backup-scheduler';

/** @type {ReturnType<typeof setInterval> | null} */
let intervalId = null;

/**
 * Executes a single backup cycle.
 *
 * Intentionally swallows errors — the scheduler must survive individual
 * failures and continue running on the next interval. Errors are logged
 * via logSystemException for observability without halting the process.
 *
 * @returns {Promise<void>}
 */
const runScheduledBackup = async () => {
  try {
    await backupDatabase();
    logSystemInfo('Scheduled backup completed', { context: CONTEXT });
  } catch (error) {
    // Non-fatal: log and allow next interval to retry
    logSystemException(error, 'Scheduled backup failed', { context: CONTEXT });
  }
};

/**
 * Returns the mtime of the most recent .enc backup file in the directory
 * resolved from BACKUP_DIR, or null if the directory is empty or unreadable.
 *
 * Returns null (rather than throwing) for all error cases — a missing or
 * unreadable directory is treated the same as having no backups, which
 * triggers an immediate run in startBackupScheduler.
 *
 * @returns {Promise<number|null>} Most recent backup timestamp in ms, or null
 */
const getLastBackupTimestamp = async () => {
  const backupDir = process.env.BACKUP_DIR;

  // Env var not set — cannot locate backup directory, treat as no backup
  if (!backupDir) return null;

  try {
    const files = await fs.readdir(backupDir);
    const encFiles = files.filter((f) => f.endsWith('.enc'));

    if (encFiles.length === 0) return null;

    const mtimes = await Promise.all(
      encFiles.map((f) =>
        fs.stat(path.join(backupDir, f)).then((s) => s.mtimeMs)
      )
    );

    return Math.max(...mtimes);
  } catch {
    // Directory missing or unreadable — treat as no backup
    return null;
  }
};

/**
 * Starts an in-process backup scheduler as a fallback when
 * system cron is unavailable (containers, serverless, etc.).
 *
 * On startup, checks whether a recent backup already exists. If none is
 * found or the most recent backup is older than the resolved interval, a
 * backup runs immediately. Otherwise, the first run is deferred to the
 * first interval tick, avoiding redundant backups on frequent reboots.
 *
 * The interval is registered synchronously regardless of the immediate-run
 * decision — the schedule clock always starts from process startup.
 *
 * Calling this while already running is a no-op.
 *
 * Interval resolution order:
 *   1. options.intervalMs        — caller override
 *   2. BACKUP_INTERVAL_MS env    — environment configuration
 *   3. 24 hours                  — hardcoded default
 *
 * @param {Object} [options]
 * @param {number} [options.intervalMs] - Interval override in milliseconds
 * @returns {void}
 */
const startBackupScheduler = (options = {}) => {
  if (intervalId) {
    // Prevent duplicate schedulers — caller should check before re-invoking
    logSystemInfo('Backup scheduler already running, skipping', {
      context: CONTEXT,
    });
    return;
  }

  const parsed = parseInt(process.env.BACKUP_INTERVAL_MS, 10);
  const intervalMs =
    options.intervalMs ?? (isNaN(parsed) ? 24 * 60 * 60 * 1000 : parsed);

  logSystemInfo('Starting in-process backup scheduler', {
    context: CONTEXT,
    intervalMs,
  });

  // Check for a recent backup before deciding whether to run immediately.
  // setInterval is registered below regardless — schedule clock starts now.
  getLastBackupTimestamp()
    .then((lastTs) => {
      const isStale = !lastTs || Date.now() - lastTs > intervalMs;

      if (isStale) {
        logSystemInfo('No recent backup found — running immediately', {
          context: CONTEXT,
          lastTs,
        });
        void runScheduledBackup();
      } else {
        logSystemInfo('Recent backup exists — skipping immediate run', {
          context: CONTEXT,
          lastTs,
          ageMs: Date.now() - lastTs,
        });
      }
    })
    .catch((error) => {
      // Timestamp check failed — run immediately rather than risk missing a backup
      logSystemWarn('Timestamp check failed — running backup immediately', {
        context: CONTEXT,
        reason: error.message,
      });
      void runScheduledBackup();
    });

  // Register interval synchronously — clock starts from process boot, not first backup
  intervalId = setInterval(runScheduledBackup, intervalMs);
};

/**
 * Stops the in-process backup scheduler and clears the interval.
 *
 * Safe to call when the scheduler is not running — exits silently.
 * Intended for graceful shutdown hooks.
 *
 * @returns {void}
 */
const stopBackupScheduler = () => {
  if (!intervalId) return; // already stopped — no-op

  clearInterval(intervalId);
  intervalId = null;

  logSystemInfo('Backup scheduler stopped', { context: CONTEXT });
};

module.exports = {
  startBackupScheduler,
  stopBackupScheduler,
};
