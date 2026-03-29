/**
 * @file file-hash-utils.js
 * @description
 * Streaming SHA-256 file hashing utility.
 *
 * Provides memory-safe, deterministic file hashing suitable for
 * content-based deduplication, stable storage key generation (e.g. S3 paths),
 * and cache reuse detection across high-concurrency workloads.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const AppError = require('./AppError');

/**
 * Computes a SHA-256 hash for a file using a read stream to avoid loading
 * the entire file into memory. Suitable for large files and high-concurrency workloads.
 *
 * Guarantees:
 *   • Memory-safe: streams data incrementally, never buffers the full file
 *   • Deterministic: identical file contents always produce the same hash
 *   • Double-settle safe: the settled flag prevents late-firing stream events
 *     from resolving or rejecting an already-settled Promise
 *   • Structured rejection: rejects with AppError.fileSystemError, not a raw Error,
 *     so the global error handler receives typed, contextual failure information
 *
 * @param {string} filePath - Absolute or relative path to the file to hash
 * @returns {Promise<string>} Resolves to the hex-encoded SHA-256 digest
 * @throws {AppError} FileSystemError if the file cannot be read or the stream fails
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
        // hash.update() can throw synchronously on a corrupted or invalid chunk.
        // Routing through fail() ensures this surfaces as a Promise rejection
        // rather than an unhandled exception on the event emitter.
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
