const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logInfo } = require('../utils/logger-helper');

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
 * Deletes old backups, keeping only the most recent ones.
 * @param {string} dir - Backup directory.
 * @param {number} maxFiles - Maximum number of backups to keep.
 */
const cleanupOldBackups = (dir, maxFiles) => {
  const files = fs.readdirSync(dir).map((file) => ({
    name: file,
    time: fs.statSync(path.join(dir, file)).mtime.getTime(),
  }));
  files.sort((a, b) => b.time - a.time);
  const filesToDelete = files.slice(maxFiles);
  filesToDelete.forEach((file) => {
    fs.unlinkSync(path.join(dir, file.name));
    logInfo(`Deleted old backup: ${file.name}`);
  });
};

module.exports = { ensureDirectory, generateHash, saveHashToFile, cleanupOldBackups };
