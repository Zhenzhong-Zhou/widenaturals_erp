const crypto = require('crypto');
const fs = require('fs/promises');
const AppError = require('./AppError');

/**
 * Computes a hash string (SHA1) for a file.
 * @param {string} filePath
 * @returns {Promise<string>} Hash hex string
 */
const getFileHash = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha1').update(buffer).digest('hex');
  } catch (err) {
    // Use your structured error helper for consistency
    throw AppError.fileSystemError(`Failed to hash file: ${filePath}`, { cause: err });
  }
};

module.exports = {
  getFileHash,
};
