const fs = require('node:fs/promises');
const path = require('node:path');
const { loadEnv } = require('../../config/env');
const { ensureDirectory } = require('./utils/file-system');
const { logSystemInfo, logSystemWarn, logSystemException } = require('../../utils/logging/system-logger');
const AppError = require('../../utils/AppError');
const { downloadFileFromS3 } = require('../../utils/aws-s3-service');
const { verifyFileIntegrity } = require('./utils/file-hash');
const { decryptFile } = require('./utils/backup-crypto-utils');
const { restoreDatabase } = require('./restore-database');

/**
 * Full restore pipeline: downloads from S3 (production) or reads locally
 * (non-production), verifies integrity, decrypts, and restores to PostgreSQL.
 *
 * Pipeline order:
 *   1. Download  → .enc + .iv from S3 (production only)
 *   2. Verify    → SHA256 integrity check if hash file is present on S3
 *   3. Decrypt   → produces plain .sql backup file
 *   4. Restore   → pg_restore into target database
 *   5. Cleanup   → all temp files removed in finally, regardless of outcome
 *
 * @param {{
 *   s3KeyEnc: string,
 *   databaseName: string,
 *   encryptionKey: string,
 *   dbUser: string,
 *   dbPassword?: string,
 *   isProduction?: boolean
 * }} params
 * @returns {Promise<void>}
 * @throws {AppError} If any pipeline step fails.
 */
const restoreBackup = async ({
                               s3KeyEnc,
                               databaseName,
                               encryptionKey,
                               dbUser,
                               dbPassword = '',
                               isProduction = true,
                             }) => {
  // Resolve env at call time — not at module load — so loadEnv() has already run
  loadEnv();
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  const tempDir = path.join(__dirname, '../temp');
  await ensureDirectory(tempDir);
  
  // Track all files written during this pipeline so the finally block can
  // remove them unconditionally — whether the restore succeeded or failed
  let encryptedFilePath, ivFilePath, decryptedFilePath;
  
  try {
    logSystemInfo('Starting database restore', {
      context: 'restore-backup',
      isProduction,
      databaseName,
    });
    
    if (isProduction) {
      if (!bucketName) {
        throw AppError.validationError('Missing required environment variable: AWS_S3_BUCKET_NAME', {
          context: 'restore-backup',
        });
      }
      
      encryptedFilePath = path.join(tempDir, path.basename(s3KeyEnc));
      ivFilePath        = `${encryptedFilePath}.iv`;
      decryptedFilePath = encryptedFilePath.replace('.enc', '');
      
      // Step 1 — download encrypted backup and its IV sidecar
      await downloadFileFromS3(bucketName, s3KeyEnc,          encryptedFilePath);
      await downloadFileFromS3(bucketName, `${s3KeyEnc}.iv`,  ivFilePath);
      
      logSystemInfo('Encrypted backup and IV downloaded from S3', {
        context: 'restore-backup',
        files: [s3KeyEnc, `${s3KeyEnc}.iv`],
      });
      
      // Step 2 — attempt integrity check; non-fatal if the hash file is absent
      // (passing null as the dest path signals downloadFileFromS3 to return the
      //  file content as a string rather than writing it to disk)
      let originalHash = null;
      try {
        originalHash = await downloadFileFromS3(bucketName, `${s3KeyEnc}.sha256`, null, true);
        logSystemInfo('SHA256 hash downloaded, verifying integrity', {
          context: 'restore-backup',
          file: encryptedFilePath,
        });
        await verifyFileIntegrity(encryptedFilePath, originalHash);
      } catch {
        logSystemWarn('SHA256 file unavailable — skipping integrity check', {
          context: 'restore-backup',
          s3Key: `${s3KeyEnc}.sha256`,
        });
      }
    } else {
      // Non-production: treat s3KeyEnc as a local filesystem path to the .enc file
      encryptedFilePath = path.resolve(s3KeyEnc);
      ivFilePath        = `${s3KeyEnc}.iv`;
      decryptedFilePath = encryptedFilePath.replace(/\.enc$/, '');
      
      // Confirm both required local files exist before proceeding
      try {
        await Promise.all([fs.access(encryptedFilePath), fs.access(ivFilePath)]);
      } catch {
        throw AppError.notFoundError('Required local backup files not found', {
          context: 'restore-backup',
          encryptedFilePath,
          ivFilePath,
        });
      }
      
      logSystemInfo('Local encrypted backup and IV found', {
        context: 'restore-backup',
        encryptedFilePath,
        ivFilePath,
      });
    }
    
    // Step 3 — decrypt; decryptFile owns key-format validation and cleans up
    //           any partial output if it fails mid-write
    await decryptFile(encryptedFilePath, decryptedFilePath, encryptionKey, ivFilePath);
    
    // Step 4 — restore from the now-decrypted local file
    await restoreDatabase({ decryptedFilePath, databaseName, dbUser, dbPassword });
    
  } catch (error) {
    logSystemException(error, 'Database restore failed', {
      context: 'restore-backup',
      databaseName,
      s3Key: s3KeyEnc,
    });
    throw error;
    
  } finally {
    // Step 5 — always remove temp files; failures are warned but not re-thrown
    //           so they cannot mask the original error
    const filesToRemove = [encryptedFilePath, ivFilePath, decryptedFilePath].filter(Boolean);
    
    await Promise.allSettled(
      filesToRemove.map(async (file) => {
        try {
          await fs.unlink(file);
          logSystemInfo('Deleted temporary file', { context: 'restore-backup', file });
        } catch (cleanupError) {
          logSystemWarn('Failed to delete temporary file', {
            context: 'restore-backup',
            file,
            errorMessage: cleanupError.message,
          });
        }
      })
    );
  }
};

module.exports = {
  restoreBackup,
};
