/**
 * @file backup-db.js
 * @description Script to back up the target database to a file.
 */

const { exec } = require('child_process');
const path = require('path');
const { logInfo, logError } = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const fs = require('fs');

// Load environment variables
const { env } = loadEnv();

const targetDatabase = process.env.DB_NAME; // Target database name
const backupDir = process.env.BACKUP_DIR || './backups'; // Backup directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Timestamp for the backup file
const backupFile = path.join(backupDir, `${targetDatabase}-${timestamp}.sql`);

/**
 * Creates a backup of the target database.
 */
const backupDatabase = async () => {
  if (!targetDatabase) {
    logError('Environment variable DB_NAME is missing.');
    return;
  }
  
  try {
    // Ensure the backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      logInfo(`Created backup directory at: ${backupDir}`);
    }
    
    logInfo(`Starting backup for database: '${targetDatabase}'`);
    const dumpCommand = `pg_dump --no-owner --no-comments --clean --if-exists -d ${targetDatabase} -f ${backupFile}`;
    
    exec(dumpCommand, (error, stdout, stderr) => {
      if (error) {
        logError(`Backup failed: ${stderr}`);
        process.exit(1); // Exit with error code
      } else {
        logInfo(`Database backup successful. Backup file: ${backupFile}`);
      }
    });
  } catch (error) {
    logError('Unexpected error during backup operation.', error);
    process.exit(1); // Exit with error code
  }
};

// Export the function for reusability
module.exports = { backupDatabase };

// Self-executing script for standalone use
if (require.main === module) {
  backupDatabase()
    .then(() => logInfo('Database backup completed successfully.'))
    .catch((error) => {
      logError('Failed to back up the database.', error);
      process.exit(1); // Handles errors and exits cleanly
    });
}
