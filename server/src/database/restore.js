const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('../config/env');
const { decryptFile } = require('./encryption');
const {
  logSystemInfo,
  logSystemWarn, logSystemException
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { downloadFileFromS3 } = require('../utils/aws-s3-service');
const { verifyFileIntegrity } = require('./file-management');

loadEnv();

const bucketName = process.env.AWS_S3_BUCKET_NAME;

/**
 * Executes a safe pg_restore command using spawn with no shell interpolation.
 */
const runPgRestore = ({ decryptedFilePath, databaseName, dbUser, dbPassword }) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--clean',
      '--if-exists',
      '--jobs=4',
      '--format=custom',
      `--dbname=${databaseName}`,
      `--username=${dbUser}`,
      decryptedFilePath,
    ];
    
    const env = { ...process.env };
    if (dbPassword) env.PGPASSWORD = dbPassword;
    
    const restore = spawn('pg_restore', args, { env });
    
    let stdout = '';
    let stderr = '';
    
    restore.stdout.on('data', (data) => (stdout += data.toString()));
    restore.stderr.on('data', (data) => (stderr += data.toString()));
    
    restore.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`pg_restore failed with code ${code}\n${stderr}`));
      }
      resolve({ stdout, stderr });
    });
  });
};

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
      throw AppError.notFoundError(`Decrypted file not found: ${decryptedFilePath}`);
    }
    
    logSystemInfo('Executing pg_restore command (safe spawn)', {
      context: 'restore-db',
      database: databaseName,
      decryptedFilePath,
    });
    
    const { stdout, stderr } = await runPgRestore({
      decryptedFilePath,
      databaseName,
      dbUser,
      dbPassword,
    });
    
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
