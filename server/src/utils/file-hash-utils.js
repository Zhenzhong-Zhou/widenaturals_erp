const crypto = require('crypto');
const fs = require('fs');
const AppError = require('./AppError');

/**
 * @async
 * @function
 * @description
 * Computes an SHA-256 hash for a file using a streaming approach to avoid
 * loading the entire file into memory. Suitable for large files and
 * high-concurrency workloads.
 *
 * This helper is typically used for:
 *  - Content-based deduplication
 *  - Stable object key generation (e.g. S3 paths)
 *  - Cache reuse detection
 *
 * Guarantees:
 *  - Memory-safe (streaming)
 *  - Deterministic output for identical file contents
 *  - Rejects with a structured AppError on I/O failure
 *
 * @param {string} filePath
 *   Absolute or relative path to the file to hash.
 *
 * @returns {Promise<string>}
 *   Resolves to the hexadecimal SHA-256 hash of the file contents.
 *
 * @throws {AppError}
 *   Throws a filesystem error if the file cannot be read or the stream fails.
 */
const getFileHashStream = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    let settled = false;
    
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(
        AppError.fileSystemError(`Failed to hash file: ${filePath}`, {
          cause: err,
        })
      );
    };
    
    stream.on('error', fail);
    
    stream.on('data', (chunk) => {
      try {
        hash.update(chunk);
      } catch (err) {
        fail(err);
      }
    });
    
    stream.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(hash.digest('hex'));
    });
  });

module.exports = {
  getFileHashStream,
};
