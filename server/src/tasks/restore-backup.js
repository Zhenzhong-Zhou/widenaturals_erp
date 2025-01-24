/**
 * @file restore-backup.js
 * @description Script to decrypt and restore a database backup.
 */

const { loadEnv } = require('../config/env');
const fs = require('fs');
const { decryptFile } = require('../database/encryption');
const { restoreDatabase } = require('../database/restore');

loadEnv();

const encryptedFile = process.argv[2] || process.env.ENCRYPTED_FILE;
const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
const databaseName = process.env.DB_NAME;

(async () => {
  try {
    // Validate environment variables
    if (!encryptedFile || !fs.existsSync(encryptedFile)) {
      throw new Error(
        `Encrypted backup file not found. Ensure ENCRYPTED_FILE is set to a valid path: ${encryptedFile}`
      );
    }

    if (!encryptionKey || Buffer.from(encryptionKey, 'hex').length !== 32) {
      throw new Error(
        'Invalid encryption key length. Ensure BACKUP_ENCRYPTION_KEY is a 64-character hexadecimal string.'
      );
    }

    if (!databaseName) {
      throw new Error(
        'Database name is missing. Ensure DB_NAME is set in the environment variables.'
      );
    }

    // Construct associated file paths
    const decryptedFile = encryptedFile.replace('.enc', ''); // Remove .enc extension for decrypted SQL file
    const ivFile = `${encryptedFile}.iv`; // Initialization Vector file

    if (!fs.existsSync(ivFile)) {
      throw new Error(
        `IV file not found. Ensure the file exists at: ${ivFile}`
      );
    }

    console.log('Decrypting backup file...');
    await decryptFile(encryptedFile, decryptedFile, encryptionKey, ivFile);

    console.log('Restoring database from decrypted file...');
    await restoreDatabase(decryptedFile, databaseName);

    // Optionally, delete the decrypted file after successful restoration
    fs.unlinkSync(decryptedFile);
    console.log('Restoration complete. Decrypted file deleted.');
  } catch (error) {
    console.error('Failed to decrypt and restore the backup:', error.message);
    process.exit(1); // Exit with failure
  }
})();
