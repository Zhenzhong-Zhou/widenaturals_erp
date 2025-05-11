/**
 * @file backup-scheduler.js
 * @description Script to perform database backups for use with cron.
 */

const { backupDatabase } = require('../../database/backup-db');
const {
  logSystemInfo,
  logSystemException
} = require('../../utils/system-logger');
const { handleExit } = require('../../utils/on-exit');

/**
 * Executes the database backup process.
 */
const runBackup = async () => {
  logSystemInfo('Starting manual database backup process...', {
    context: 'run-backup',
  });
  
  try {
    await backupDatabase();
    logSystemInfo('Manual database backup completed successfully.', {
      context: 'run-backup',
    });
  } catch (error) {
    logSystemException(error, 'Manual database backup failed.', {
      context: 'run-backup',
    });
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
