const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const { loadEnv } = require('../config/env');
const { decryptFile } = require('./encryption');
const { logInfo, logWarn, logError } = require('../utils/logger-helper'); // Import decryptFile function

const execAsync = promisify(exec);
loadEnv();

/**
 * Restores a decrypted SQL backup to the specified PostgreSQL database.
 *
 * @param {string} decryptedFilePath - The absolute path to the decrypted SQL backup file.
 * @param {string} databaseName - The name of the PostgreSQL database to restore the backup into.
 * @param {string} dbUser - The PostgreSQL user executing the restore operation.
 * @returns {Promise<void>} Resolves when the restore process completes successfully.
 *
 * @throws {Error} Throws an error if the restore operation fails.
 *
 * @example
 * await restoreDatabase('/backups/restore.sql', 'my_database', 'postgres');
 */
const restoreDatabase = async (decryptedFilePath, databaseName, dbUser) => {
  const restoreCommand = `pg_restore --clean --if-exists --jobs=4 --format=custom --dbname=${databaseName} --username=${dbUser} ${decryptedFilePath}`;
  try {
    const { stdout, stderr } = await execAsync(restoreCommand);
    logInfo(`Restore command output: ${stdout}`);
    if (stderr) {
      logWarn(`Restore command warnings: ${stderr}`);
    }
  } catch (error) {
    throw new Error(`Database restore failed: ${error.message}`);
  }
};

/**
 * Handles the full restoration process.
 * Decrypts the encrypted backup and restores the database.
 * @param {string} encryptedFilePath - Path to the encrypted backup file.
 * @param {string} databaseName - Target database name.
 * @param {string} encryptionKey - Encryption key for decryption.
 */
const restoreBackup = async (
  encryptedFilePath,
  databaseName,
  encryptionKey
) => {
  const decryptedFilePath = encryptedFilePath.replace('.enc', ''); // Plain SQL file
  const ivFilePath = `${encryptedFilePath}.iv`; // Path to IV file

  // Ensure all required files exist
  if (!fs.existsSync(encryptedFilePath)) {
    throw new Error(`Encrypted backup file not found: ${encryptedFilePath}`);
  }
  if (!fs.existsSync(ivFilePath)) {
    throw new Error(`IV file not found: ${ivFilePath}`);
  }

  try {
    console.log('Decrypting backup file...');
    await decryptFile(
      encryptedFilePath,
      decryptedFilePath,
      encryptionKey,
      ivFilePath
    );

    logInfo('Restoring database from decrypted file...');
    await restoreDatabase(decryptedFilePath, databaseName);

    // Optionally, delete the decrypted file after successful restoration
    fs.unlinkSync(decryptedFilePath);
    logInfo('Restoration complete. Decrypted file deleted.');
  } catch (error) {
    logError('Failed to restore the backup:', error.message);
    throw error;
  }
};

module.exports = { restoreDatabase, restoreBackup };
