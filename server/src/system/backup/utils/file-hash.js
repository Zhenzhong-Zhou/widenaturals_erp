const fs = require('fs');
const { writeFile } = require('fs/promises');
const crypto = require('crypto');
const {
  logSystemInfo,
  logSystemException,
} = require('../../../utils/logging/system-logger');

/**
 * Generates SHA256 hash of a file using streaming.
 *
 * Uses a readable stream to avoid loading the entire file into memory.
 * Suitable for large backup files.
 *
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} SHA256 hash in hex format
 */
const generateHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    // Update hash incrementally as data is read
    stream.on('data', (chunk) => hash.update(chunk));
    
    // Finalize hash when stream ends
    stream.on('end', () => resolve(hash.digest('hex')));
    
    // Propagate stream errors
    stream.on('error', reject);
  });
};

/**
 * Saves a SHA256 hash string to a file.
 *
 * @param {string} hash - SHA256 hash string
 * @param {string} filePath - Destination file path
 * @returns {Promise<void>}
 */
const saveHashToFile = async (hash, filePath) => {
  await writeFile(filePath, hash, 'utf8');
};

/**
 * Verifies file integrity by comparing computed SHA256 hash
 * against the expected hash.
 *
 * Logs verification start, success, and failure events.
 *
 * @param {string} filePath - Path to the file to verify
 * @param {string} expectedHash - Expected SHA256 hash
 * @returns {Promise<void>}
 *
 * @throws {Error} If hash does not match or verification fails
 */
const verifyFileIntegrity = async (filePath, expectedHash) => {
  try {
    // Basic input validation (defensive programming)
    if (!filePath || !expectedHash) {
      throw new Error('Invalid input: filePath and expectedHash are required');
    }
    
    logSystemInfo('Verifying file integrity', {
      context: 'backup',
      operation: 'verifyFileIntegrity',
      filePath,
    });
    
    const generatedHash = await generateHash(filePath);
    
    // Strict comparison (no trimming — hashes must match exactly)
    if (generatedHash !== expectedHash) {
      throw new Error(
        'File integrity check failed: hash mismatch (possible corruption or tampering)'
      );
    }
    
    logSystemInfo('File integrity verified successfully', {
      context: 'backup',
      operation: 'verifyFileIntegrity',
      filePath,
    });
  } catch (error) {
    logSystemException(error, 'Failed to verify file integrity', {
      context: 'backup',
      operation: 'verifyFileIntegrity',
      filePath,
    });
    
    throw error;
  }
};

module.exports = {
  generateHash,
  saveHashToFile,
  verifyFileIntegrity,
};
