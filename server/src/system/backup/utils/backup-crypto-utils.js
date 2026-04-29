/**
 * @file file-encryption.js
 * @description AES-256-CBC streaming encryption and decryption for files.
 *
 * Security model:
 * - Confidentiality only — no integrity or authenticity guarantees
 * - File tampering will NOT be detected; corrupted ciphertext causes a
 *   silent bad decrypt, not an error
 * - For authenticated encryption, migrate to AES-256-GCM
 *
 * IV handling:
 * - A random 16-byte IV is generated per encryption and written to a
 *   separate file. The same IV file must be supplied for decryption.
 *   Never reuse an IV with the same key.
 */

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { createReadStream, createWriteStream } = require('node:fs');
const { pipeline } = require('node:stream/promises');
const AppError = require('../../../utils/AppError');
const { logSystemInfo } = require('../../../utils/logging/system-logger');

// Identifies this module in error context and log metadata
const CONTEXT = 'file-encryption';

const AES_KEY_BYTES = 32; // AES-256 requires a 32-byte key
const AES_IV_BYTES = 16; // CBC mode requires a 16-byte IV

/**
 * Validates that an encryption key is a correctly formatted AES-256 key.
 * Throws an AppError.validationError if the key is invalid.
 *
 * @param {string} encryptionKey - Hex string (must be exactly 64 hex chars = 32 bytes).
 * @param {string} operation     - Caller name, used in error context.
 * @returns {Buffer} The key as a Buffer, ready for use with `crypto`.
 * @throws {AppError} If the key length or encoding is invalid.
 */
const parseAndValidateKey = (encryptionKey, operation) => {
  const key = Buffer.from(encryptionKey, 'hex');

  if (
    encryptionKey.length !== AES_KEY_BYTES * 2 ||
    key.length !== AES_KEY_BYTES
  ) {
    throw AppError.validationError(
      'Invalid AES-256 key: must be a 64-character hex string (32 bytes)',
      {
        context: CONTEXT,
        operation,
      }
    );
  }

  return key;
};

/**
 * Validates that a Buffer is a correctly sized AES-CBC IV.
 *
 * @param {Buffer} iv        - The IV buffer to validate.
 * @param {string} operation - Caller name, used in error context.
 * @throws {AppError} If the IV length is not exactly `AES_IV_BYTES`.
 */
const validateIv = (iv, operation) => {
  if (iv.length !== AES_IV_BYTES) {
    throw AppError.validationError(
      `Invalid IV: expected ${AES_IV_BYTES} bytes, got ${iv.length}`,
      { context: CONTEXT, operation }
    );
  }
};

/**
 * Removes a file if it exists, silently ignoring errors.
 * Used to clean up partial output files after a failed stream pipeline.
 *
 * @param {string} filePath
 * @returns {Promise<void>}
 */
const cleanupFile = async (filePath) => {
  await fs.unlink(filePath).catch(() => {});
};

/**
 * Encrypts a file using AES-256-CBC with a randomly generated IV.
 *
 * Uses Node.js streams throughout — memory usage is constant regardless
 * of file size. The IV is written to `ivFilePath` and must be preserved
 * for decryption.
 *
 * Security notes:
 * - Provides confidentiality only (no integrity or authentication)
 * - File tampering will NOT be detected
 * - For production-grade security, consider AES-256-GCM
 *
 * @param {string} filePath          - Path to the plaintext file to encrypt.
 * @param {string} encryptedFilePath - Destination path for the encrypted output.
 * @param {string} encryptionKey     - Hex string, exactly 64 chars (32 bytes).
 * @param {string} ivFilePath        - Path where the generated IV will be stored.
 * @returns {Promise<void>}
 * @throws {AppError} If the key is invalid, or if encryption or file I/O fails.
 */
const encryptFile = async (
  filePath,
  encryptedFilePath,
  encryptionKey,
  ivFilePath
) => {
  const key = parseAndValidateKey(encryptionKey, 'encryptFile');
  const iv = /** @type {Buffer} */ (crypto.randomBytes(AES_IV_BYTES));

  try {
    // IV must be persisted before streaming — decryption cannot proceed without it
    await fs.writeFile(ivFilePath, iv);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    await pipeline(
      createReadStream(filePath),
      cipher,
      createWriteStream(encryptedFilePath)
    );

    logSystemInfo('File encrypted successfully', {
      context: CONTEXT,
      operation: 'encryptFile',
      filePath,
      encryptedFilePath,
      ivFilePath,
    });
  } catch (error) {
    // Remove partial output to avoid leaving corrupted ciphertext on disk
    await cleanupFile(encryptedFilePath);

    throw error instanceof AppError
      ? error
      : AppError.systemError('File encryption failed', {
          context: CONTEXT,
          operation: 'encryptFile',
          cause: error,
        });
  }
};

/**
 * Decrypts a file encrypted with `encryptFile` using AES-256-CBC.
 *
 * Uses Node.js streams throughout — memory usage is constant regardless
 * of file size. The IV file must be the one written during encryption.
 *
 * Note: AES-256-CBC provides no integrity guarantees. A tampered or
 * corrupted ciphertext may decrypt silently to garbage rather than
 * throwing an error.
 *
 * @param {string} encryptedFilePath - Path to the encrypted file.
 * @param {string} decryptedFilePath - Destination path for the decrypted output.
 * @param {string} encryptionKey     - Hex string, exactly 64 chars (32 bytes).
 *                                     Must match the key used during encryption.
 * @param {string} ivFilePath        - Path to the IV file written during encryption.
 * @returns {Promise<void>}
 * @throws {AppError} If the key or IV is invalid, or if decryption or file I/O fails.
 */
const decryptFile = async (
  encryptedFilePath,
  decryptedFilePath,
  encryptionKey,
  ivFilePath
) => {
  const key = parseAndValidateKey(encryptionKey, 'decryptFile');

  try {
    const iv = /** @type {Buffer} */ (await fs.readFile(ivFilePath));

    validateIv(iv, 'decryptFile');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    await pipeline(
      createReadStream(encryptedFilePath),
      decipher,
      createWriteStream(decryptedFilePath)
    );

    logSystemInfo('File decrypted successfully', {
      context: CONTEXT,
      operation: 'decryptFile',
      encryptedFilePath,
      decryptedFilePath,
    });
  } catch (error) {
    // Remove partial output to avoid leaving incomplete plaintext on disk
    await cleanupFile(decryptedFilePath);

    throw error instanceof AppError
      ? error
      : AppError.systemError('File decryption failed', {
          context: CONTEXT,
          operation: 'decryptFile',
          cause: error,
        });
  }
};

module.exports = {
  encryptFile,
  decryptFile,
};
