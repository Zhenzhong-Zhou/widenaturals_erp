/**
 * @file backup-database.js
 * @description Orchestrates PostgreSQL database backup: dump, encrypt, hash, cleanup, and S3 upload.
 *
 * Execution modes:
 * - Imported: call `backupDatabase()` directly
 * - Standalone: `node backup-database.js` — runs and exits with code 1 on failure
 *
 * Environment variables required:
 * - DB_NAME, DB_USER, DB_PASSWORD
 * - BACKUP_ENCRYPTION_KEY — 64-character hex string (32 bytes)
 * - BACKUP_DIR            — path relative to this file
 * - MAX_BACKUPS           — positive multiple of 3 (default: 15)
 * - AWS_S3_BUCKET_NAME    — required for production S3 upload
 * - NODE_ENV              — set to 'production' to enable S3 upload
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { loadEnv } = require('../../config/env');
const AppError = require('../../utils/AppError');
const {
  logSystemInfo,
  logSystemException
} = require('../../utils/logging/system-logger');
const { ensureDirectory } = require('./utils/file-system');
const { runPgDump } = require('./process/pg-dump');
const { encryptFile } = require('./utils/backup-crypto-utils');
const { generateHash, saveHashToFile } = require('./utils/file-hash');
const { cleanupOldBackupsService } = require('./services/cleanup-old-backups');
const { uploadBackupToS3 } = require('./adapters/backup-s3-adapter');
const { cleanupLocalFiles } = require('./adapters/backup-fs-adapter');

/**
 * Resolves and validates all backup configuration from environment variables.
 * Called once per `backupDatabase()` invocation — not at module load time.
 *
 * @returns {{
 *   isProduction: boolean,
 *   targetDatabase: string,
 *   backupDir: string,
 *   backupFile: string,
 *   encryptedFile: string,
 *   ivFile: string,
 *   hashFile: string,
 *   dbUser: string | undefined,
 *   dbPassword: string | undefined,
 *   maxBackups: number,
 *   bucketName: string | undefined,
 *   encryptionKey: string
 * }}
 * @throws {AppError} If any required variable is missing or invalid.
 */
const resolveConfig = () => {
  const targetDatabase = process.env.DB_NAME;
  if (!targetDatabase) {
    throw AppError.validationError('Missing required environment variable: DB_NAME', {
      context: 'backup-config',
    });
  }
  
  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw AppError.validationError('Missing required environment variable: BACKUP_ENCRYPTION_KEY', {
      context: 'backup-config',
    });
  }
  
  // parseInt returns NaN for missing/non-numeric values — fall back to 15 only then
  const rawMaxBackups = parseInt(process.env.MAX_BACKUPS, 10);
  const maxBackups    = isNaN(rawMaxBackups) ? 15 : rawMaxBackups;
  
  if (!Number.isInteger(maxBackups) || maxBackups <= 0 || maxBackups % 3 !== 0) {
    throw AppError.validationError(
      `Invalid MAX_BACKUPS: ${maxBackups}. Must be a positive multiple of 3.`,
      { context: 'backup-config' }
    );
  }
  
  const backupDirEnv  = process.env.BACKUP_DIR ?? '../../../backups';
  const backupDir     = path.resolve(__dirname, backupDirEnv);
  const timestamp     = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName  = `${targetDatabase}-${timestamp}`;
  const backupFile    = path.join(backupDir, `${baseFileName}.sql`);
  const encryptedFile = `${backupFile}.enc`;
  const ivFile        = `${encryptedFile}.iv`;
  const hashFile      = `${encryptedFile}.sha256`;
  
  return {
    isProduction: process.env.NODE_ENV === 'production',
    targetDatabase,
    backupDir,
    backupFile,
    encryptedFile,
    ivFile,
    hashFile,
    dbUser:       process.env.DB_USER,
    dbPassword:   process.env.DB_PASSWORD,
    maxBackups,
    bucketName:   process.env.AWS_S3_BUCKET_NAME,
    encryptionKey,
  };
};

/**
 * Backs up the PostgreSQL database: dumps, encrypts, hashes, cleans up old
 * backups, and uploads to S3 if running in production.
 *
 * Error logging is intentionally omitted here — errors propagate to the
 * caller (or the standalone boundary below) which owns the log entry.
 *
 * @returns {Promise<void>}
 * @throws {AppError} If configuration is invalid or any backup step fails.
 */
const backupDatabase = async () => {
  loadEnv();
  
  const {
    isProduction, targetDatabase, backupDir, backupFile,
    encryptedFile, ivFile, hashFile, dbUser, dbPassword,
    maxBackups, bucketName, encryptionKey,
  } = resolveConfig();
  
  await ensureDirectory(backupDir);
  
  logSystemInfo(`Starting backup for database: '${targetDatabase}'`, {
    context: 'backup',
    backupDir,
  });
  
  // Dump the database to a SQL file using pg_dump
  await runPgDump(
    [
      '--format=custom', '--no-owner', '--clean', '--if-exists',
      `--file=${backupFile}`,
      `--username=${dbUser}`,
      `--dbname=${targetDatabase}`,
    ],
    { isProduction, dbUser, dbPassword }
  );
  
  // Encrypt — encryptFile owns key validation and partial-file cleanup on failure
  await encryptFile(backupFile, encryptedFile, encryptionKey, ivFile);
  
  // Plain-text SQL is no longer needed once encrypted copy exists
  await fs.unlink(backupFile).catch(() => {});
  
  // Hash the encrypted file so recipients can verify integrity
  const hash = await generateHash(encryptedFile);
  await saveHashToFile(hash, hashFile);
  
  await cleanupOldBackupsService({ dir: backupDir, maxBackups, isProduction, bucketName });
  
  logSystemInfo('Backup encrypted and saved locally', {
    context: 'backup',
    encryptedFile,
    hashFile,
  });
  
  if (isProduction && bucketName) {
    await uploadBackupToS3({ encryptedFile, ivFile, hashFile, bucketName });
    // Local copies removed after confirmed upload — best-effort, failures ignored
    await cleanupLocalFiles([encryptedFile, ivFile, hashFile]);
  } else {
    logSystemInfo('Skipping S3 upload: not in production or no bucket configured', {
      context: 'backup-upload',
      isProduction,
      bucketName: bucketName ?? null,
    });
  }
};

module.exports = {
  backupDatabase
};

// Standalone boundary — this catch is the final observer, so it owns the error log
if (require.main === module) {
  backupDatabase()
    .then(() => {
      logSystemInfo('Database backup completed successfully', { context: 'backup' });
    })
    .catch((error) => {
      logSystemException(error, 'Database backup failed', {
        context: 'backup',
        severity: 'critical',
      });
      process.exit(1);
    });
}
