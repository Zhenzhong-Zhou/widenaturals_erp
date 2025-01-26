const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const { loadEnv } = require('../config/env');
const { decryptFile } = require('./encryption'); // Import decryptFile function

const execAsync = promisify(exec);
loadEnv();

/**
 * Restores a decrypted SQL backup to the database.
 * @param {string} decryptedFilePath - Path to the plain-text SQL file.
 * @param {string} databaseName - Target database name.
 * @returns {Promise<void>}
 */
const restoreDatabase = async (decryptedFilePath, databaseName) => {
  const restoreCommand = `psql -d ${databaseName} -f ${decryptedFilePath}`;
  try {
    const { stdout, stderr } = await execAsync(restoreCommand);
    console.log(`Restore command output: ${stdout}`);
    if (stderr) {
      console.warn(`Restore command warnings: ${stderr}`);
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

    console.log('Restoring database from decrypted file...');
    await restoreDatabase(decryptedFilePath, databaseName);

    // Optionally, delete the decrypted file after successful restoration
    fs.unlinkSync(decryptedFilePath);
    console.log('Restoration complete. Decrypted file deleted.');
  } catch (error) {
    console.error('Failed to restore the backup:', error.message);
    throw error;
  }
};

module.exports = { restoreDatabase, restoreBackup };
