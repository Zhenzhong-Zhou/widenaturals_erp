/**
 * @file restore-backup-cli.local.js
 * @description CLI entry point for restoring a database from a local encrypted
 * backup file. Intended for development and testing only — does not interact
 * with S3.
 *
 * Usage:
 *   node restore-backup-cli.local.js [--encFile <path>]
 *
 * If --encFile is not provided, the user is prompted interactively.
 * The IV sidecar path is derived automatically by appending '.iv' to the
 * encrypted file path — both files must exist in the same directory.
 *
 * Environment variables required:
 *   DB_NAME, DB_USER, DB_PASSWORD, BACKUP_ENCRYPTION_KEY
 */

const path = require('node:path');
const readline = require('node:readline');
const { loadEnv } = require('../config/env');
const { restoreBackup } = require('../system/backup/restore-backup');
const {
  logSystemInfo,
  logSystemError,
  logSystemException,
} = require('../utils/logging/system-logger');

loadEnv();

const args = require('minimist')(process.argv.slice(2), {
  string: ['encFile'],
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

if (require.main === module) {
  (async () => {
    try {
      const databaseName  = process.env.DB_NAME;
      const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
      const dbUser        = process.env.DB_USER;
      const dbPassword    = process.env.DB_PASSWORD;
      
      // Validate required env vars up front — log exactly which ones are absent
      const missingVars = ['DB_NAME', 'BACKUP_ENCRYPTION_KEY', 'DB_USER', 'DB_PASSWORD']
        .filter((key) => !process.env[key]);
      
      if (missingVars.length > 0) {
        logSystemError('Missing required environment variables', {
          context: 'restore-cli-local',
          missing: missingVars,
        });
        process.exit(1);
      }
      
      // Resolve the local .enc file path — from CLI arg or interactive prompt
      const encFile = args.encFile || await prompt('Enter local encrypted backup file path (.enc)');
      
      if (!encFile) {
        logSystemError('No encrypted file path provided', { context: 'restore-cli-local' });
        process.exit(1);
      }
      
      if (!encFile.endsWith('.enc')) {
        logSystemError('Provided file does not have a .enc extension', {
          context: 'restore-cli-local',
          encFile,
        });
        process.exit(1);
      }
      
      logSystemInfo('Starting local restore', {
        context: 'restore-cli-local',
        encFile: path.basename(encFile),
        databaseName,
      });
      
      // isProduction: false — skips S3 download, reads directly from local paths.
      // IV sidecar is derived inside restoreBackup by appending '.iv' to encFile.
      await restoreBackup({
        s3KeyEnc: path.resolve(encFile),
        databaseName,
        encryptionKey,
        dbUser,
        dbPassword,
        isProduction: false,
      });
      
      logSystemInfo('Local database restore completed successfully', {
        context: 'restore-cli-local',
      });
      
    } catch (error) {
      logSystemException(error, 'Local database restore failed', {
        context: 'restore-cli-local',
      });
      process.exit(1);
    }
  })();
}
