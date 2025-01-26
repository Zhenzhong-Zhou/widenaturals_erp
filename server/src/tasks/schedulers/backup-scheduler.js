/**
 * @file backup-scheduler.js
 * @description Script to perform database backups for use with cron.
 */

const { backupDatabase } = require('../../database/backup-db');
const { logInfo, logError } = require('../../utils/logger-helper');
const { handleExit } = require('../../utils/on-exit');

/**
 * Executes the database backup process.
 */
const runBackup = async () => {
  logInfo('Starting manual database backup process...');
  try {
    await backupDatabase();
    logInfo('Manual database backup completed successfully.');
  } catch (error) {
    logError('Manual database backup failed.', error);
    await handleExit(1); // Exit with error code for monitoring
  }
};

// Self-executing script for standalone use
if (require.main === module) {
  runBackup()
    .then(() => {
      console.log('Backup completed successfully.');
      process.exit(0); // Exit with success
    })
    .catch((error) => {
      console.error('Backup failed:', error.message);
      process.exit(1); // Exit with failure
    });
}

module.exports = { runBackup };
