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
const AppError = require('../utils/AppError');
const { uploadFileToS3 } = require('../utils/aws-s3-service');
const {
  logSystemError,
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');

// Load environment variables
loadEnv();

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const targetDatabase = process.env.DB_NAME; // Name of the target database
const backupDir =
  path.resolve(__dirname, process.env.BACKUP_DIR) || '../../backups'; // Directory to store backups
const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Timestamp for file naming
const baseFileName = `${targetDatabase}-${timestamp}`; // Base name for backup files
const backupFile = path.join(backupDir, `${baseFileName}.sql`); // Plain-text SQL file path
const encryptedFile = `${backupFile}.enc`; // Encrypted file path
const ivFile = `${encryptedFile}.iv`; // Initialization vector file path
const hashFile = `${encryptedFile}.sha256`; // Hash file path
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const maxBackups = parseInt(process.env.MAX_BACKUPS, 10) || 15; // Maximum number of backups to keep
const bucketName = process.env.AWS_S3_BUCKET_NAME; // S3 Bucket name

// Validate maxFiles - Ensure it's a positive multiple of 3
if (!Number.isInteger(maxBackups) || maxBackups <= 0 || maxBackups % 3 !== 0) {
  logSystemError('Invalid MAX_BACKUPS value', {
    value: maxBackups,
    context: 'backup-config',
    severity: 'critical',
  });

  throw AppError.validationError(
    `Invalid MAX_BACKUPS value: ${maxBackups}. It must be a positive multiple of 3 (e.g., 3, 6, 9, etc.).`
  );
}

/**
 * Backs up the target PostgreSQL database and uploads it to S3 if in production.
 */
const backupDatabase = async () => {
  if (!targetDatabase) {
    throw AppError.validationError('Environment variable DB_NAME is missing.');
  }

  try {
    // Ensure the backup directory exists
    await ensureDirectory(backupDir);
    logSystemInfo(`Starting backup for database: '${targetDatabase}'`, {
      context: 'backup',
      backupDir,
    });

    // Build the pg_dump argument list
    const dumpArgs = [
      '--format=custom',
      '--no-owner',
      '--clean',
      '--if-exists',
      `--file=${backupFile}`,
      `--username=${dbUser}`,
      `--dbname=${targetDatabase}`,
    ];

    // Run pg_dump safely with spawn
    await runPgDump(dumpArgs, isProduction, dbUser, dbPassword);

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

    // Generate an SHA-256 hash of the encrypted file
    const hash = await generateHash(encryptedFile);
    await saveHashToFile(hash, hashFile);

    // Cleanup old backups
    await cleanupOldBackups(backupDir, maxBackups, isProduction, bucketName);

    logSystemInfo('Backup encrypted and saved', {
      context: 'backup',
      encryptedFile,
    });

    // Upload to S3 if in production
    if (isProduction && bucketName) {
      try {
        // Prepare S3 keys
        const s3KeyEnc = `backups/${path.basename(encryptedFile)}`;
        const s3KeyIv = `backups/${path.basename(ivFile)}`;
        const s3KeySha256 = `backups/${path.basename(hashFile)}`;

        // Upload all files with retry logic
        await uploadFileToS3(
          encryptedFile,
          bucketName,
          s3KeyEnc,
          'application/gzip'
        );
        await uploadFileToS3(
          ivFile,
          bucketName,
          s3KeyIv,
          'application/octet-stream'
        );
        await uploadFileToS3(hashFile, bucketName, s3KeySha256, 'text/plain');

        logSystemInfo('Successfully uploaded backup files to S3', {
          context: 'backup-upload',
          files: [s3KeyEnc, s3KeyIv, s3KeySha256],
        });

        // Optionally delete the encrypted file locally after successful upload
        await fs.unlink(encryptedFile);
        await fs.unlink(ivFile); // Also delete the initialization vector
        await fs.unlink(hashFile); // And the hash file
      } catch (uploadError) {
        logSystemException(
          uploadError,
          'Failed to upload encrypted backup to S3',
          {
            context: 'backup-upload',
            severity: 'error',
          }
        );

        throw uploadError;
      }
    } else {
      logSystemInfo(
        'Skipping S3 upload: Not in production or no bucket name provided.',
        {
          context: 'backup-upload',
        }
      );
    }
  } catch (error) {
    logSystemException(error, 'Error during backup operation', {
      context: 'backup',
      severity: 'critical',
    });
    throw error;
  }
};

// Export the backup function for reuse in other scripts
module.exports = { backupDatabase };

// Self-executing script for standalone usage
if (require.main === module) {
  backupDatabase()
    .then(() => {
      logSystemInfo('Database backup completed successfully.', {
        context: 'backup',
      });
    })
    .catch((error) => {
      logSystemException(error, 'Failed to back up the database', {
        context: 'backup',
        severity: 'critical',
      });
      process.exit(1); // Exit with an error code for monitoring
    });
}
