const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Ensures the backup directory exists.
 * @param {string} dir - Directory path.
 */
const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logInfo(`Created backup directory at: ${dir}`);
  }
};

/**
 * Generates a SHA-256 hash for the given file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - Hash value.
 */
const generateHash = (filePath) => {
  const hash = crypto.createHash('sha256');
  const fileData = fs.readFileSync(filePath);
  hash.update(fileData);
  return hash.digest('hex');
};

/**
 * Saves a hash to a file.
 * @param {string} hash - Hash value.
 * @param {string} filePath - Path to save the hash file.
 */
const saveHashToFile = (hash, filePath) => {
  fs.writeFileSync(filePath, hash, 'utf8');
};

/**
 * Deletes old backups and associated files, keeping only the most recent ones.
 * @param {string} dir - Backup directory.
 * @param {number} maxFiles - Maximum number of backups to keep.
 */
const cleanupOldBackups = (dir, maxFiles) => {
  try {
    // Validate maxFiles
    if (!Number.isInteger(maxFiles) || maxFiles <= 0) {
      throw new Error(`Invalid maxFiles value: ${maxFiles}. Must be a positive integer.`);
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(dir)
      .filter((file) => file.endsWith('.enc')) // Only process encrypted backup files
      .map((file) => ({
        name: file,
        time: fs.statSync(path.join(dir, file)).mtime.getTime(),
      }));
    
    // If no files are found, log and exit
    if (files.length === 0) {
      logInfo('No backup files found for cleanup.');
      return;
    }
    
    // Sort files by modification time (newest first)
    files.sort((a, b) => b.time - a.time);
    
    // Identify files to delete (keep the most recent 'maxFiles')
    const filesToDelete = files.slice(maxFiles);
    
    // If there are no files to delete, log and exit
    if (filesToDelete.length === 0) {
      logInfo(`All backups are within the limit of ${maxFiles} files. No files deleted.`);
      return;
    }
    
    // Delete identified files and associated metadata
    filesToDelete.forEach((file) => {
      try {
        const filePath = path.join(dir, file.name);
        
        // Delete the encrypted backup file (.enc)
        fs.unlinkSync(filePath);
        logInfo(`Deleted old backup: ${file.name}`);
        
        // Delete associated hash file (e.g., .sha256)
        const hashFilePath = `${filePath}.sha256`;
        if (fs.existsSync(hashFilePath)) {
          fs.unlinkSync(hashFilePath);
          logInfo(`Deleted associated hash file: ${path.basename(hashFilePath)}`);
        }
        
        // Delete associated initialization vector file (.iv)
        const ivFilePath = `${filePath}.iv`;
        if (fs.existsSync(ivFilePath)) {
          fs.unlinkSync(ivFilePath);
          logInfo(`Deleted associated IV file: ${path.basename(ivFilePath)}`);
        }
      } catch (deleteError) {
        logError(`Failed to delete file: ${file.name}`, { error: deleteError.message });
      }
    });
  } catch (error) {
    logError('Error during cleanup of old backups:', { error: error.message });
    throw error; // Re-throw error for higher-level handling
  }
};

module.exports = { ensureDirectory, generateHash, saveHashToFile, cleanupOldBackups };
