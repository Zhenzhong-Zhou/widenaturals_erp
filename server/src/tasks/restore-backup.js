/**
 * @file restore-backup.js
 * @description Script to decrypt and restore a database backup.
 */

const { loadEnv } = require('../config/env');
const fs = require('fs');
const { decryptFile } = require('../database/encryption');
const { restoreDatabase } = require('../database/restore');

loadEnv();

const encryptedFile = process.env.ENCRYPTED_FILE;
const decryptedFile = encryptedFile.replace('.enc', ''); // Remove .enc extension
const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
const databaseName = process.env.DB_NAME;

(async () => {
  try {
    // Validate encryption key
    if (!encryptionKey || Buffer.from(encryptionKey, 'hex').length !== 32) {
      throw new Error('Invalid encryption key length. Ensure BACKUP_ENCRYPTION_KEY is a 64-character hexadecimal string.');
    }
    
    if (!fs.existsSync(encryptedFile)) {
      throw new Error(`Encrypted file not found at: ${encryptedFile}`);
    }
    
    console.log('Decrypting backup file...');
    await decryptFile(encryptedFile, decryptedFile, encryptionKey);
    
    console.log('Restoring database from decrypted file...');
    await restoreDatabase(decryptedFile, databaseName);
    
    // Optionally, delete the decrypted file after restoring
    fs.unlinkSync(decryptedFile);
    console.log('Restoration complete. Decrypted file deleted.');
  } catch (error) {
    console.error('Failed to decrypt and restore the backup:', error.message);
  }
})();
