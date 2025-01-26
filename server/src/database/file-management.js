const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Ensures the backup directory exists.
 * @param {string} dir - Directory path.
 * @returns {Promise<void>}
 */
const ensureDirectory = async (dir) => {
  try {
    await fs.access(dir); // Check if directory exists
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Directory does not exist, create it
      await fs.mkdir(dir, { recursive: true });
      logInfo(`Created backup directory at: ${dir}`);
    } else {
      throw error; // Re-throw other errors
    }
  }
};

/**
 * Generates a SHA-256 hash for the given file.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<string>} - Hash value.
 */
const generateHash = async (filePath) => {
  const fileData = await fs.readFile(filePath); // Read file asynchronously
  const hash = crypto.createHash('sha256');
  hash.update(fileData);
  return hash.digest('hex'); // Return hash as a hex string
};

/**
 * Saves a hash to a file.
 * @param {string} hash - Hash value.
 * @param {string} filePath - Path to save the hash file.
 * @returns {Promise<void>}
 */
const saveHashToFile = async (hash, filePath) => {
  await fs.writeFile(filePath, hash, 'utf8'); // Write hash asynchronously
};

/**
 * Deletes old backups and associated files, keeping only the most recent ones.
 * @param {string} dir - Backup directory.
 * @param {number} maxFiles - Maximum number of backups to keep.
 * @returns {Promise<void>}
 */
const cleanupOldBackups = async (dir, maxFiles) => {
  try {
    // Validate maxFiles
    if (!Number.isInteger(maxFiles) || maxFiles <= 0) {
      throw new Error(
        `Invalid maxFiles value: ${maxFiles}. Must be a positive integer.`
      );
    }

    const allFiles = await fs.readdir(dir);

    // Collect file metadata for sorting
    const backupFiles = (
      await Promise.all(
        allFiles
          .filter((file) => file.endsWith('.enc')) // Only process encrypted backup files
          .map(async (file) => {
            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            return { name: file, time: stats.mtime.getTime() };
          })
      )
    ).sort((a, b) => b.time - a.time); // Sort files by modification time (newest first)

    // If no files are found, log and exit
    if (backupFiles.length === 0) {
      logInfo('No backup files found for cleanup.');
      return;
    }

    // Identify files to delete
    const filesToDelete = backupFiles.slice(maxFiles);

    // If there are no files to delete, log and exit
    if (filesToDelete.length === 0) {
      logInfo(
        `All backups are within the limit of ${maxFiles} files. No files deleted.`
      );
      return;
    }

    // Delete files and associated metadata
    await Promise.all(
      filesToDelete.map(async (file) => {
        const filePath = path.join(dir, file.name);
        try {
          await fs.unlink(filePath);
          logInfo(`Deleted old backup: ${file.name}`);

          // Attempt to delete associated files
          const hashFilePath = `${filePath}.sha256`;
          const ivFilePath = `${filePath}.iv`;
          await fs
            .unlink(hashFilePath)
            .catch(() => logInfo(`No hash file to delete for: ${file.name}`));
          await fs
            .unlink(ivFilePath)
            .catch(() => logInfo(`No IV file to delete for: ${file.name}`));
        } catch (deleteError) {
          logError(`Failed to delete file: ${file.name}`, {
            error: deleteError.message,
          });
        }
      })
    );

    logInfo(
      `Cleanup of old backups completed. ${filesToDelete.length} files deleted.`
    );
  } catch (error) {
    logError('Error during cleanup of old backups:', { error: error.message });
    throw error;
  }
};

module.exports = {
  ensureDirectory,
  generateHash,
  saveHashToFile,
  cleanupOldBackups,
};
