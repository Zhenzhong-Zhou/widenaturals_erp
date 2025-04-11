const { restoreBackup } = require('../database/restore');
const { logInfo, logError } = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const { listBackupsFromS3 } = require('../utils/aws-s3-service');
const readline = require('readline');

loadEnv();

const args = require('minimist')(process.argv.slice(2), {
  string: ['s3KeyEnc', 's3KeyIv', 's3KeySha256'],
  boolean: ['isProduction'],
  default: { isProduction: true },
});

/**
 * Prompts user to input a file path if not provided initially.
 * @param {string} promptText - The message to prompt the user with.
 * @returns {Promise<string>} The path entered by the user.
 */
const promptForFilePath = (promptText) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`\n${promptText}: `, (filePath) => {
      rl.close();
      resolve(filePath.trim());
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
      logError(
        'Essential environment variables (DB_NAME, BACKUP_ENCRYPTION_KEY, DB_USER, DB_PASSWORD) are missing.'
      );
      process.exit(1);
    }

    if (isProduction && bucketName && (!s3KeyEnc || !s3KeyIv || !s3KeySha256)) {
      logInfo(`Fetching available backups from S3 bucket: ${bucketName}...`);

      try {
        const backups = await listBackupsFromS3(bucketName, 'backups/');

        if (backups.length === 0) {
          logError('No backups found in the S3 bucket.');
          process.exit(1);
        }

        console.log(
          'Available Backups:',
          backups.map((file) => file.Key)
        );
      } catch (err) {
        logError('Failed to fetch backups from S3:', err.message);
        process.exit(1);
      }
    }

    if (!s3KeyEnc)
      s3KeyEnc = await promptForFilePath('Enter Encrypted Backup File Path');
    if (!s3KeyIv) s3KeyIv = await promptForFilePath('Enter IV File Path');
    if (!s3KeySha256)
      s3KeySha256 = await promptForFilePath('Enter SHA256 File Path');

    if (!s3KeyEnc || !s3KeyIv || !s3KeySha256) {
      logError(
        'Missing required paths. Make sure to provide paths for all files.'
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

    logInfo('Database restoration completed successfully.');
  } catch (error) {
    logError('Database restoration failed:', error.message);
    process.exit(1);
  }
})();
