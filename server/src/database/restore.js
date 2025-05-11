const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('../config/env');
const { decryptFile } = require('./encryption');
const {
  logSystemInfo,
  logSystemWarn, logSystemException
} = require('../utils/system-logger');
const { logInfo, logWarn, logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const { downloadFileFromS3 } = require('../utils/aws-s3-service');
const { verifyFileIntegrity } = require('./file-management');

const execAsync = promisify(exec);
loadEnv();
const bucketName = process.env.AWS_S3_BUCKET_NAME;

/**
 * Restores a decrypted SQL backup to the specified PostgreSQL database.
 *
 * @param {string} decryptedFilePath - The absolute path to the decrypted SQL backup file.
 * @param {string} databaseName - The name of the PostgreSQL database to restore the backup into.
 * @param {string} dbUser - The PostgreSQL user executing the restore operation.
 * @param {string} dbPassword - The password for the PostgreSQL user (optional).
 * @param {string} s3KeyEnc - The S3 key of the encrypted backup file (if applicable).
 * @returns {Promise<void>}
 */
const restoreDatabase = async (
  decryptedFilePath,
  databaseName,
  dbUser,
  dbPassword = '',
  s3KeyEnc = ''
) => {
  try {
    // Download from S3 if specified
    if (!fs.existsSync(decryptedFilePath)) {
      logSystemInfo('Downloading file from S3...', {
        context: 'restore-db',
        s3Key: s3KeyEnc,
        targetPath: decryptedFilePath,
      });

      await downloadFileFromS3(bucketName, s3KeyEnc, decryptedFilePath);
      
      logSystemInfo(`File downloaded from S3`, {
        context: 'restore-db',
        decryptedFilePath,
      });
    }

    if (!fs.existsSync(decryptedFilePath)) {
      throw AppError.notFoundError(
        `Decrypted file not found: ${decryptedFilePath}`
      );
    }

    const restoreCommand = dbPassword
      ? `PGPASSWORD=${dbPassword} pg_restore --clean --if-exists --jobs=4 --format=custom --dbname=${databaseName} --username=${dbUser} ${decryptedFilePath}`
      : `pg_restore --clean --if-exists --jobs=4 --format=custom --dbname=${databaseName} --username=${dbUser} ${decryptedFilePath}`;
    
    logSystemInfo('Executing pg_restore command', {
      context: 'restore-db',
      database: databaseName,
      command: restoreCommand,
    });

    const { stdout, stderr } = await execAsync(restoreCommand);
    
    if (stdout) {
      logSystemInfo('Restore command output', {
        context: 'restore-db',
        database: databaseName,
        stdout,
      });
    }
    
    if (stderr) {
      logSystemWarn('Restore command warnings', {
        context: 'restore-db',
        database: databaseName,
        stderr,
      });
    }
    
    logSystemInfo('Database restore completed successfully', {
      context: 'restore-db',
      database: databaseName,
    });
  } catch (error) {
    logSystemException(error, 'Database restore failed', {
      context: 'restore-db',
      decryptedFilePath,
      database: databaseName,
      s3Key: s3KeyEnc,
    });
    
    throw AppError.databaseError(`Database restore failed: ${error.message}`);
  }
};

/**
 * Restores a backup from an encrypted file from S3.
 *
 * @param {string} s3KeyEnc - Encrypted file path or S3 key.
 * @param {string} databaseName - Target database name.
 * @param {string} encryptionKey - Key for decryption.
 * @param {string} dbUser - Database user for restoration.
 * @param {string} dbPassword - Database password.
 * @param {boolean} isProduction - Whether the operation is in production mode.
 * @returns {Promise<void>}
 */
const restoreBackup = async (
  s3KeyEnc,
  databaseName,
  encryptionKey,
  dbUser,
  dbPassword,
  isProduction = true
) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let encryptedFilePath, ivFilePath, decryptedFilePath;

  try {
    logSystemInfo('Starting database restore process', {
      context: 'restore-backup',
      isProduction,
      databaseName,
    });
    
    if (isProduction) {
      if (!bucketName)
        throw AppError.validationError('AWS_S3_BUCKET_NAME is not set.');

      encryptedFilePath = path.join(tempDir, path.basename(s3KeyEnc));
      ivFilePath = `${encryptedFilePath}.iv`;
      decryptedFilePath = encryptedFilePath.replace('.enc', '');

      // Download encrypted file and IV file
      await downloadFileFromS3(bucketName, s3KeyEnc, encryptedFilePath);
      await downloadFileFromS3(bucketName, `${s3KeyEnc}.iv`, ivFilePath);

      // Attempt to download SHA256 file as a string for verification
      let originalHash = null;
      try {
        originalHash = await downloadFileFromS3(
          bucketName,
          `${s3KeyEnc}.sha256`,
          null,
          true
        );
        
        logSystemInfo('SHA256 file downloaded', {
          context: 'restore-backup',
          s3Key: `${s3KeyEnc}.sha256`,
        });
      } catch (error) {
        logSystemWarn('SHA256 file not found, skipping integrity check', {
          context: 'restore-backup',
          s3Key: `${s3KeyEnc}.sha256`,
        });
      }
      
      logSystemInfo('All necessary files downloaded from S3', {
        context: 'restore-backup',
        files: [s3KeyEnc, `${s3KeyEnc}.iv`],
      });

      // Verify file integrity if SHA256 file was found
      if (originalHash) {
        logSystemInfo('Verifying file integrity...', {
          context: 'restore-backup',
          file: encryptedFilePath,
        });
        await verifyFileIntegrity(encryptedFilePath, originalHash);
      }
    } else {
      encryptedFilePath = s3KeyEnc;
      ivFilePath = `${s3KeyEnc}.iv`;
      decryptedFilePath = encryptedFilePath.replace('.enc', '');

      if (!fs.existsSync(encryptedFilePath) || !fs.existsSync(ivFilePath)) {
        throw new AppError.notFoundError(
          'Required backup files not found locally.'
        );
      }
      
      logSystemInfo('Local encrypted and IV files found.', {
        context: 'restore-backup',
        encryptedFilePath,
        ivFilePath,
      });
    }

    await decryptFile(
      encryptedFilePath,
      decryptedFilePath,
      encryptionKey,
      ivFilePath
    );
    await restoreDatabase(decryptedFilePath, databaseName, dbUser, dbPassword);
  } catch (error) {
    logSystemException(error, 'Database restoration failed', {
      context: 'restore-backup',
      databaseName,
      s3Key: s3KeyEnc,
    });
    
    throw error;
  } finally {
    [encryptedFilePath, ivFilePath, decryptedFilePath].forEach((file) => {
      if (file && fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          logSystemInfo('Deleted temporary file', {
            context: 'restore-backup',
            file,
          });
        } catch (cleanupError) {
          logSystemWarn('Failed to delete temporary file', {
            context: 'restore-backup',
            file,
            errorMessage: cleanupError.message,
          });
        }
      }
    });
  }
};

module.exports = {
  restoreDatabase,
  restoreBackup,
};
