/**
 * @file run-backup.js
 * @description System task to execute database backup.
 *
 * Responsibilities:
 * - Execute backup workflow
 * - Emit structured system-level logs
 *
 * Non-Responsibilities:
 * - DOES NOT control process lifecycle (no direct process exit)
 * - DOES NOT handle scheduling (cron handled externally)
 *
 * Usage:
 * - Can be invoked by cron, CLI, or other system orchestrators
 * - Entry point (bottom of file) handles lifecycle termination
 */

const { backupDatabase } = require('../backup-database');
const {
  logSystemInfo,
  logSystemException,
} = require('../../../utils/logging/system-logger');
const { handleExit } = require('../../lifecycle/on-exit');

const CONTEXT = 'system-task:backup';

/**
 * Executes the database backup process.
 *
 * Design:
 * - Pure task execution (no process control)
 * - Throws on failure to allow caller to decide lifecycle handling
 *
 * @returns {Promise<void>}
 * @throws {Error} Propagates backup failure
 */
const runBackup = async () => {
  logSystemInfo('Starting database backup process...', {
    context: CONTEXT,
  });
  
  try {
    await backupDatabase();
    
    logSystemInfo('Database backup completed successfully.', {
      context: CONTEXT,
    });
  } catch (error) {
    logSystemException(error, 'Database backup failed.', {
      context: CONTEXT,
    });
    
    // Re-throw to let caller decide exit strategy
    throw error;
  }
};

module.exports = {
  runBackup
};

//--------------------------------------------------
// Standalone execution (cron / CLI entrypoint)
//--------------------------------------------------
if (require.main === module) {
  runBackup()
    .then(() => {
      void handleExit(0);
    })
    .catch((error) => {
      logSystemException(error, 'Unhandled backup execution error', {
        context: CONTEXT,
      });
      
      void handleExit(1);
    });
}
