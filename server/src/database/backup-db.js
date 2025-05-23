const fs = require('fs').promises;
const path = require('path');
const { loadEnv } = require('../config/env');
const { runPgDump } = require('./pg-dump');
const {
  ensureDirectory,
  generateHash,
  saveHashToFile,
  cleanupOldBackups,
} = require('./file-management');
const { encryptFile } = require('./encryption');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

// Load environment variables
loadEnv();

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const targetDatabase = process.env.DB_NAME; // Name of the target database
const backupDir = process.env.BACKUP_DIR || '../server/backups'; // Directory to store backups
const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Timestamp for file naming
const baseFileName = `${targetDatabase}-${timestamp}`; // Base name for backup files
const backupFile = path.join(backupDir, `${baseFileName}.sql`); // Plain-text SQL file path
const encryptedFile = `${backupFile}.enc`; // Encrypted file path
const ivFile = `${encryptedFile}.iv`; // Initialization vector file path
const hashFile = `${encryptedFile}.sha256`; // Hash file path
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump'; // Path to the pg_dump binary
const maxBackups = parseInt(process.env.MAX_BACKUPS, 10) || 5; // Maximum number of backups to keep

// Validate maxBackups
if (!Number.isInteger(maxBackups) || maxBackups <= 0) {
  throw AppError.validationError(
    `Invalid MAX_BACKUPS value: ${maxBackups}. Must be a positive integer.`
  );
}

/**
 * Backs up the target PostgreSQL database.
 * - Dumps the database using `pg_dump`.
 * - Generates a hash for the backup file.
 * - Encrypts the backup using AES-256-CBC.
 * - Cleans up old backups, keeping only the most recent.
 *
 * @throws {Error} If the database name or critical environment variables are missing.
 * @returns {Promise<void>}
 */
const backupDatabase = async () => {
  if (!targetDatabase) {
    throw AppError.validationError('Environment variable DB_NAME is missing.');
  }

  try {
    // Ensure the backup directory exists
    await ensureDirectory(backupDir);
    logInfo(`Starting backup for database: '${targetDatabase}'`);

    // Build the dump command **without exposing credentials**
    const dumpCommand = `${pgDumpPath} --format=custom --no-owner --clean --if-exists --file=${backupFile} --username=${dbUser} --dbname=${targetDatabase}`;

    // Run pg_dump with credentials securely handled
    await runPgDump(dumpCommand, isProduction, dbUser, dbPassword);

    // Generate a SHA-256 hash
    const hash = await generateHash(backupFile);
    await saveHashToFile(hash, hashFile);

    // Encrypt the SQL backup file
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (!encryptionKey || Buffer.from(encryptionKey, 'hex').length !== 32) {
      throw AppError.validationError(
        'Invalid or missing BACKUP_ENCRYPTION_KEY. Ensure it is a 64-character hexadecimal string.'
      );
    }

    await encryptFile(backupFile, encryptedFile, encryptionKey, ivFile);

    // Remove the plain-text backup file
    await fs.unlink(backupFile);

    // Cleanup old backups
    await cleanupOldBackups(backupDir, maxBackups);

    logInfo(`Backup encrypted and saved: ${encryptedFile}`);
  } catch (error) {
    logError('Error during backup operation:', { error: error.message });
    throw error;
  }
};

// Export the backup function for reuse in other scripts
module.exports = { backupDatabase };

// Self-executing script for standalone usage
if (require.main === module) {
  backupDatabase()
    .then(() => logInfo('Database backup completed successfully.'))
    .catch((error) => {
      logError('Failed to back up the database.', { error: error.message });
      process.exit(1); // Exit with an error code for monitoring
    });
}
