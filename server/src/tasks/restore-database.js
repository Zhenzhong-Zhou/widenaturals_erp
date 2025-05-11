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
const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
  logSystemError
} = require('../utils/system-logger');
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
 * Prompts the user to enter a file path for restoring a backup.
 * This is used in CLI/interactive mode only.
 *
 * @returns {Promise<string>} The trimmed user input file path.
 */
const promptForFilePath = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    logSystemInfo('Prompting user for backup file path...', {
      context: 'promptForFilePath',
    });
    
    rl.question(
      '\nPlease enter the backup file path you wish to restore: ',
      (filePath) => {
        rl.close();
        const trimmedPath = filePath.trim();
        logSystemInfo('User provided backup file path.', {
          context: 'promptForFilePath',
          filePath: trimmedPath,
        });
        resolve(trimmedPath);
      }
    );
  });
};

(async () => {
  try {
    logSystemInfo('Starting restoration process...', {
      context: 'restore-backup',
    });

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
      logSystemWarn('Database password not provided. Proceeding without password.', {
        context: 'restore-backup',
      });
    }

    // Ensure temporary directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      logSystemInfo('Temporary directory created.', {
        context: 'restore-backup',
        tempDir,
      });
    }
    
    let localFilePath = encryptedFile;

    // If no encrypted file is provided, try fetching available backups from S3
    if (!localFilePath && bucketName) {
      logSystemInfo('Fetching available backups from S3...', {
        context: 'restore-backup',
        bucket: bucketName,
      });
      
      const backups = await listBackupsFromS3(bucketName);

      if (backups.length === 0) {
        logSystemWarn('No backups found in S3 bucket.', {
          context: 'restore-backup',
          bucket: bucketName,
        });
        return; // Graceful exit if no backups are found
      }
      
      logSystemInfo('Available backups found in S3:', {
        context: 'restore-backup',
        bucket: bucketName,
        files: backups.map((file) => file.Key),
      });
      
      logSystemInfo(
        'Please specify a backup file to restore or set ENCRYPTED_FILE.',
        { context: 'restore-backup' }
      );

      // Prompt user to enter a path
      const inputPath = await promptForFilePath();

      if (inputPath) {
        localFilePath = inputPath; // Use the path provided by the user
      } else {
        logSystemError('No valid backup file path provided. Exiting...', {
          context: 'restore-backup',
        });
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
      
      logSystemInfo('Downloading encrypted backup from S3...', {
        context: 'restore-backup',
        file: localFilePath,
      });
      
      const s3KeyEnc = `backups/${path.basename(localFilePath)}`;
      localFilePath = path.join(tempDir, path.basename(localFilePath));

      await downloadFileFromS3(bucketName, s3KeyEnc, localFilePath);
      
      logSystemInfo('Encrypted file downloaded successfully from S3.', {
        context: 'restore-backup',
        file: localFilePath,
      });
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
      
      logSystemInfo('Downloading encrypted backup from S3...', {
        context: 'restore-backup',
        file: localFilePath,
      });
      
      const s3KeyEnc = `backups/${path.basename(localFilePath)}`;
      localFilePath = path.join(tempDir, path.basename(localFilePath));

      await downloadFileFromS3(bucketName, s3KeyEnc, localFilePath);
      
      logSystemInfo('Encrypted backup downloaded successfully from S3.', {
        context: 'restore-backup',
        file: localFilePath,
      });
    }

    // If no local file and no S3 key, throw an error
    if (!localFilePath && !bucketName) {
      throw AppError.notFoundError(
        'No backup file specified and no S3 bucket configured. Restoration cannot proceed.'
      );
    }

    // If a bucket is specified but no file is provided, try listing files from S3
    if (!localFilePath && bucketName) {
      logSystemInfo('Fetching available backups from S3...', {
        context: 'restore-backup',
        bucket: bucketName,
      });
      
      const backups = await listBackupsFromS3(bucketName, 'backups/');

      if (backups.length === 0) {
        throw AppError.notFoundError(
          `No backups found in S3 bucket: ${bucketName}`
        );
      }
      
      logSystemInfo('Available backups retrieved from S3.', {
        context: 'restore-backup',
        bucket: bucketName,
        files: backups.map((file) => file.Key),
      });
      
      logSystemInfo(
        'Prompting user to select a backup or define ENCRYPTED_FILE env var.',
        { context: 'restore-backup' }
      );
      
      return; // Gracefully exit if no file is provided
    }
    
    logSystemInfo('Decrypting backup file...', {
      context: 'restore-backup',
      file: localFilePath,
    });
    
    await decryptFile(localFilePath, decryptedFile, encryptionKey, ivFile);
    
    logSystemInfo('Restoring database from decrypted file...', {
      context: 'restore-backup',
      file: decryptedFile,
      db: databaseName,
    });
    
    await restoreDatabase(decryptedFile, databaseName, dbUser, dbPassword);

    // Cleanup temporary files
    fs.unlinkSync(decryptedFile);
    if (localFilePath.startsWith(tempDir)) fs.unlinkSync(localFilePath);
    if (ivFile.startsWith(tempDir)) fs.unlinkSync(ivFile);
    
    logSystemInfo('Restoration complete. Decrypted file deleted.', {
      context: 'restore-backup',
      deletedFiles: [decryptedFile],
    });
  } catch (error) {
    logSystemException(error, 'Failed to decrypt and restore the backup.', {
      context: 'restore-backup',
    });
    process.exit(1);
  }
})();
