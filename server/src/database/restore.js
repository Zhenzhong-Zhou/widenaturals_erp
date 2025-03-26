const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('../config/env');
const { decryptFile } = require('./encryption');
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
const restoreDatabase = async (decryptedFilePath, databaseName, dbUser, dbPassword = '', s3KeyEnc = '') => {
  try {
    // Download from S3 if specified
    if (!fs.existsSync(decryptedFilePath)) {
      logInfo('Downloading file from S3...');
      
      await downloadFileFromS3(bucketName, s3KeyEnc, decryptedFilePath);
      logInfo(`File downloaded from S3: ${decryptedFilePath}`);
    }
    
    if (!fs.existsSync(decryptedFilePath)) {
      throw AppError.notFoundError(`Decrypted file not found: ${decryptedFilePath}`);
    }
    
    const restoreCommand = dbPassword
      ? `PGPASSWORD=${dbPassword} pg_restore --clean --if-exists --jobs=4 --format=custom --dbname=${databaseName} --username=${dbUser} ${decryptedFilePath}`
      : `pg_restore --clean --if-exists --jobs=4 --format=custom --dbname=${databaseName} --username=${dbUser} ${decryptedFilePath}`;
    
    logInfo(`Executing restore command for database: ${databaseName}`);
    logInfo(`Restore command: ${restoreCommand}`);
    
    const { stdout, stderr } = await execAsync(restoreCommand);
    
    if (stdout) logInfo(`Restore command output: ${stdout}`);
    if (stderr) logWarn(`Restore command warnings: ${stderr}`);
    
    logInfo('Database restore completed successfully.');
  } catch (error) {
    logError('Database restore failed:', error.message);
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
    if (isProduction) {
      if (!bucketName) throw AppError.validationError('AWS_S3_BUCKET_NAME is not set.');
      
      encryptedFilePath = path.join(tempDir, path.basename(s3KeyEnc));
      ivFilePath = `${encryptedFilePath}.iv`;
      decryptedFilePath = encryptedFilePath.replace('.enc', '');
      
      // Download encrypted file and IV file
      await downloadFileFromS3(bucketName, s3KeyEnc, encryptedFilePath);
      await downloadFileFromS3(bucketName, `${s3KeyEnc}.iv`, ivFilePath);
      
      // Attempt to download SHA256 file as a string for verification
      let originalHash = null;
      try {
        originalHash = await downloadFileFromS3(bucketName, `${s3KeyEnc}.sha256`, null, true);
        logInfo('SHA256 file downloaded successfully.');
      } catch (error) {
        logWarn('No SHA256 file found. Integrity check will be skipped.');
      }
      
      logInfo('All files downloaded successfully from S3.');
      
      
      // Verify file integrity if SHA256 file was found
      if (originalHash) {
        logInfo('Verifying file integrity...');
        await verifyFileIntegrity(encryptedFilePath, originalHash);
        logInfo('File integrity verified successfully.');
      }
    } else {
      encryptedFilePath = s3KeyEnc;
      ivFilePath = `${s3KeyEnc}.iv`;
      decryptedFilePath = encryptedFilePath.replace('.enc', '');
      
      if (!fs.existsSync(encryptedFilePath) || !fs.existsSync(ivFilePath)) {
        throw new AppError.notFoundError('Required backup files not found locally.');
      }
    }
    
    await decryptFile(encryptedFilePath, decryptedFilePath, encryptionKey, ivFilePath);
    await restoreDatabase(decryptedFilePath, databaseName, dbUser, dbPassword);
  } catch (error) {
    logError('Restoration failed:', error.message);
    throw error;
  }
  finally {
    [encryptedFilePath, ivFilePath, decryptedFilePath].forEach(file => {
      if (file && fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          logInfo(`Deleted temporary file: ${file}`);
        } catch (cleanupError) {
          logWarn(`Failed to delete file: ${file} - ${cleanupError.message}`);
        }
      }
    });
  }
};

module.exports = {
  restoreDatabase,
  restoreBackup
};
