/**
 * @file restore-backup-cli.js
 * @description CLI entry point for triggering a database restore from an encrypted backup.
 *
 * Usage:
 *   node restore-backup-cli.js [--s3KeyEnc <key>] [--no-production]
 *
 * If --s3KeyEnc is not provided, the user is prompted interactively.
 * The IV and SHA256 sidecar paths are derived automatically from s3KeyEnc.
 *
 * Environment variables required:
 *   DB_NAME, DB_USER, DB_PASSWORD, BACKUP_ENCRYPTION_KEY
 *   AWS_S3_BUCKET_NAME — required when running in production mode
 */

const path = require('node:path');
const readline = require('node:readline');
const { loadEnv } = require('../config/env');
const { restoreBackup: restoreBackupCli } = require('../system/backup/restore-backup');
const { listBackupsFromS3 } = require('../utils/aws-s3-service');
const {
  logSystemInfo,
  logSystemError,
  logSystemException,
} = require('../utils/logging/system-logger');

loadEnv();

const args = require('minimist')(process.argv.slice(2), {
  string:  ['s3KeyEnc'],
  boolean: ['production'],
  default: { production: true },
});

/**
 * Prompts the user for a single line of input and resolves with the trimmed value.
 *
 * @param {string} promptText - Label displayed before the input cursor.
 * @returns {Promise<string>}
 */
const prompt = (promptText) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input:  process.stdin,
      output: process.stdout,
    });
    rl.question(`\n${promptText}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

/**
 * Lists available backups from S3 and prints them to stdout so the operator
 * can identify the correct s3KeyEnc before being prompted.
 *
 * @param {string} bucketName
 * @returns {Promise<void>}
 */
const printAvailableBackups = async (bucketName) => {
  logSystemInfo('Fetching available backups from S3', {
    context: 'restore-cli',
    bucket: bucketName,
  });
  
  const backups = await listBackupsFromS3(bucketName, 'backups/');
  
  if (backups.length === 0) {
    logSystemError('No backups found in S3 bucket', {
      context: 'restore-cli',
      bucket: bucketName,
    });
    process.exit(1);
  }
  
  // Print directly to stdout so the operator sees the list regardless of
  // whether logSystemInfo routes to a file or structured log sink
  console.log('\nAvailable backups:');
  backups.forEach((file, i) => console.log(`  ${i + 1}. ${file.Key}`));
  console.log();
};

(async () => {
  try {
    const isProduction = args.production;
    const bucketName   = process.env.AWS_S3_BUCKET_NAME;
    const databaseName = process.env.DB_NAME;
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    const dbUser       = process.env.DB_USER;
    const dbPassword   = process.env.DB_PASSWORD;
    
    // Validate required env vars up front — log exactly which ones are absent
    const missingVars = ['DB_NAME', 'BACKUP_ENCRYPTION_KEY', 'DB_USER', 'DB_PASSWORD']
      .filter((key) => !process.env[key]);
    
    if (missingVars.length > 0) {
      logSystemError('Missing required environment variables', {
        context: 'restore-cli',
        missing: missingVars,
      });
      process.exit(1);
    }
    
    if (isProduction && !bucketName) {
      logSystemError('Missing required environment variable: AWS_S3_BUCKET_NAME', {
        context: 'restore-cli',
      });
      process.exit(1);
    }
    
    // If no s3KeyEnc was passed, and we are in production, list available
    // backups from S3 so the operator can identify the correct key
    if (!args.s3KeyEnc && isProduction && bucketName) {
      await printAvailableBackups(bucketName);
    }
    
    // Resolve the encrypted backup key — from CLI arg or interactive prompt
    const s3KeyEnc = args.s3KeyEnc || await prompt('Enter encrypted backup path (s3KeyEnc)');
    
    if (!s3KeyEnc) {
      logSystemError('No encrypted backup path provided', { context: 'restore-cli' });
      process.exit(1);
    }
    
    logSystemInfo('Starting restore', {
      context: 'restore-cli',
      s3KeyEnc: path.basename(s3KeyEnc),
      isProduction,
      databaseName,
    });
    
    // IV and SHA256 sidecar paths are derived inside restoreBackup from s3KeyEnc —
    // the operator only needs to supply the .enc key
    await restoreBackupCli({
      s3KeyEnc,
      databaseName,
      encryptionKey,
      dbUser,
      dbPassword,
      isProduction,
    });
    
    logSystemInfo('Database restore completed successfully', { context: 'restore-cli' });
    
  } catch (error) {
    logSystemException(error, 'Database restore failed', { context: 'restore-cli' });
    process.exit(1);
  }
})();
