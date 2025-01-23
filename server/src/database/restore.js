/**
 * @file restore.js
 * @description Handles the restoration of database backups.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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

module.exports = { restoreDatabase };
