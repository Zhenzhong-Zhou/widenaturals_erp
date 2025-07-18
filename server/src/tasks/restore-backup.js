const { restoreBackup } = require('../database/restore');
const {
  logSystemInfo,
  logSystemError,
  logSystemException,
} = require('../utils/system-logger');
const {
  logInfo,
  logError,
  createSystemMeta,
} = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const { listBackupsFromS3 } = require('../utils/aws-s3-service');
const readline = require('readline');
const path = require('path');

loadEnv();

const args = require('minimist')(process.argv.slice(2), {
  string: ['s3KeyEnc', 's3KeyIv', 's3KeySha256'],
  boolean: ['isProduction'],
  default: { isProduction: true },
});

/**
 * Prompts the user to enter a file path.
 * This is used in CLI/interactive mode only.
 *
 * @param {string} promptText - The text to display to the user.
 * @returns {Promise<string>} - The trimmed user input file path.
 */
const promptForFilePath = (promptText) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    logSystemInfo('Prompting user for file path input...', {
      context: 'promptForFilePath',
      promptText,
    });

    rl.question(`\n${promptText}: `, (filePath) => {
      rl.close();
      const trimmed = filePath.trim();
      logSystemInfo('User provided file path.', {
        context: 'promptForFilePath',
        filePath: path.basename(trimmed), // Optional: omit or sanitize if sensitive
      });
      resolve(trimmed);
    });
  });
};

(async () => {
  try {
    let { s3KeyEnc, s3KeyIv, s3KeySha256, isProduction } = args;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const databaseName = process.env.DB_NAME;
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;

    if (!databaseName || !encryptionKey || !dbUser || !dbPassword) {
      logSystemError('Essential environment variables are missing.', {
        context: 'restore-verify',
        missing: {
          DB_NAME: !!databaseName,
          BACKUP_ENCRYPTION_KEY: !!encryptionKey,
          DB_USER: !!dbUser,
          DB_PASSWORD: !!dbPassword,
        },
      });
      process.exit(1);
    }

    if (isProduction && bucketName && (!s3KeyEnc || !s3KeyIv || !s3KeySha256)) {
      logSystemInfo(`Fetching available backups from S3 bucket...`, {
        context: 'restore-verify',
        bucket: bucketName,
      });

      try {
        const backups = await listBackupsFromS3(bucketName, 'backups/');

        if (backups.length === 0) {
          logSystemError('No backups found in the S3 bucket.', {
            context: 'restore-verify',
            bucket: bucketName,
          });
          process.exit(1);
        }

        logSystemInfo('Available backups:', {
          context: 'restore-verify',
          files: backups.map((file) => file.Key),
        });
      } catch (err) {
        logSystemException(err, 'Failed to fetch backups from S3.', {
          context: 'restore-verify',
          bucket: bucketName,
        });
        process.exit(1);
      }
    }

    if (!s3KeyEnc)
      s3KeyEnc = await promptForFilePath('Enter Encrypted Backup File Path');
    if (!s3KeyIv) s3KeyIv = await promptForFilePath('Enter IV File Path');
    if (!s3KeySha256)
      s3KeySha256 = await promptForFilePath('Enter SHA256 File Path');

    if (!s3KeyEnc || !s3KeyIv || !s3KeySha256) {
      logSystemError(
        'Missing required paths. Make sure to provide paths for all files.',
        {
          context: 'restore-backup',
          missing: {
            s3KeyEnc: !!s3KeyEnc,
            s3KeyIv: !!s3KeyIv,
            s3KeySha256: !!s3KeySha256,
          },
        }
      );
      process.exit(1);
    }

    await restoreBackup(
      s3KeyEnc,
      databaseName,
      encryptionKey,
      dbUser,
      dbPassword,
      isProduction
    );

    logSystemInfo('Database restoration completed successfully.', {
      context: 'restore-backup',
    });
  } catch (error) {
    logSystemException(error, 'Database restoration failed.', {
      context: 'restore-backup',
    });
    process.exit(1);
  }
})();
