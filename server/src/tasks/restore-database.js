/**
 * @file restore-database.js
 * @description Script to decrypt and restore a database.
 */

const { loadEnv } = require('../config/env');
const fs = require('fs');
const path = require('path');
const { decryptFile } = require('../database/encryption');
const { restoreDatabase } = require('../database/restore');
const {
  downloadFileFromS3,
  listBackupsFromS3,
} = require('../utils/aws-s3-service');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const readline = require('readline');

loadEnv();

const encryptedFile = process.argv[2] || process.env.ENCRYPTED_FILE;
const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
const databaseName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const tempDir = path.join(__dirname, '../temp'); // Temporary folder for downloaded files

/**
 * Prompts user to input a backup file path if not provided initially.
 * @returns {Promise<string>} The path entered by the user.
 */
const promptForFilePath = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      '\nPlease enter the backup file path you wish to restore: ',
      (filePath) => {
        rl.close();
        resolve(filePath.trim());
      }
    );
  });
};

(async () => {
  try {
    logInfo(`Starting restoration process...`);

    // Validate environment variables
    if (!encryptionKey || Buffer.from(encryptionKey, 'hex').length !== 32) {
      throw AppError.validationError(
        'Invalid encryption key. Ensure BACKUP_ENCRYPTION_KEY is a 64-character hexadecimal string.'
      );
    }

    if (!databaseName) {
      throw AppError.validationError(
        'Database name is missing. Set DB_NAME in the environment variables.'
      );
    }

    if (!dbUser) {
      throw AppError.validationError(
        'Database user is missing. Set DB_USER in the environment variables.'
      );
    }

    if (!dbPassword) {
      logWarn('Database password not provided. Proceeding without password.');
    }

    // Ensure temporary directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let localFilePath = encryptedFile;

    // If no encrypted file is provided, try fetching available backups from S3
    if (!localFilePath && bucketName) {
      logInfo(`Fetching available backups from S3...`);
      const backups = await listBackupsFromS3(bucketName);

      if (backups.length === 0) {
        logWarn(`No backups found in S3 bucket: ${bucketName}`);
        return; // Gracefully exit if no backups are found
      }

      logInfo(
        'Available Backups:',
        backups.map((file) => file.Key)
      );
      logInfo(
        'Please specify a backup file to restore from the above list or set ENCRYPTED_FILE.'
      );

      // Prompt user to enter a path
      const inputPath = await promptForFilePath();

      if (inputPath) {
        localFilePath = inputPath; // Use the path provided by the user
      } else {
        logError('No valid backup file path provided. Exiting...');
        return; // Gracefully exit if no file is provided
      }
    }

    // Check if the file exists locally
    if (localFilePath && !fs.existsSync(localFilePath)) {
      if (!bucketName) {
        throw AppError.notFoundError(
          `Encrypted backup file not found locally: ${localFilePath}`
        );
      }

      logInfo(`Downloading encrypted file from S3: ${localFilePath}`);

      const s3KeyEnc = `backups/${path.basename(localFilePath)}`;
      localFilePath = path.join(tempDir, path.basename(localFilePath));

      await downloadFileFromS3(bucketName, s3KeyEnc, localFilePath);
      logInfo(
        `Encrypted file downloaded successfully from S3: ${localFilePath}`
      );
    }

    // Construct associated file paths
    const decryptedFile = localFilePath.replace('.enc', '');
    let ivFile = `${localFilePath}.iv`;

    const s3KeyIv = `backups/${path.basename(localFilePath)}.iv`;
    await downloadFileFromS3(bucketName, s3KeyIv, ivFile);

    // Check if the file exists locally
    if (localFilePath && !fs.existsSync(localFilePath)) {
      if (!bucketName) {
        throw AppError.notFoundError(
          `Encrypted backup file not found locally: ${localFilePath} and no S3 bucket provided.`
        );
      }

      logInfo(`Downloading encrypted file from S3: ${localFilePath}`);

      const s3KeyEnc = `backups/${path.basename(localFilePath)}`;
      localFilePath = path.join(tempDir, path.basename(localFilePath));

      await downloadFileFromS3(bucketName, s3KeyEnc, localFilePath);
      logInfo(
        `Encrypted file downloaded successfully from S3: ${localFilePath}`
      );
    }

    // If no local file and no S3 key, throw an error
    if (!localFilePath && !bucketName) {
      throw AppError.notFoundError(
        'No backup file specified and no S3 bucket configured. Restoration cannot proceed.'
      );
    }

    // If bucket is specified but no file is provided, try listing files from S3
    if (!localFilePath && bucketName) {
      logInfo(`Fetching available backups from S3...`);
      const backups = await listBackupsFromS3(bucketName, 'backups/');

      if (backups.length === 0) {
        throw AppError.notFoundError(
          `No backups found in S3 bucket: ${bucketName}`
        );
      }

      logInfo(
        'Available Backups:',
        backups.map((file) => file.Key)
      );
      logInfo(
        'Please specify a backup file to restore from the above list or set ENCRYPTED_FILE.'
      );
      return; // Gracefully exit if no file is provided
    }

    logInfo('Decrypting backup file...');
    await decryptFile(localFilePath, decryptedFile, encryptionKey, ivFile);

    logInfo('Restoring database from decrypted file...');
    await restoreDatabase(decryptedFile, databaseName, dbUser, dbPassword);

    // Cleanup temporary files
    fs.unlinkSync(decryptedFile);
    if (localFilePath.startsWith(tempDir)) fs.unlinkSync(localFilePath);
    if (ivFile.startsWith(tempDir)) fs.unlinkSync(ivFile);

    logInfo('Restoration complete. Decrypted file deleted.');
  } catch (error) {
    logError('Failed to decrypt and restore the backup:', error.message);
    process.exit(1);
  }
})();
