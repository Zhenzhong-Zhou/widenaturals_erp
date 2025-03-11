const crypto = require('crypto');
const fs = require('fs').promises; // Use promise-based fs methods
const { createReadStream, createWriteStream } = require('fs');
const AppError = require('../utils/AppError'); // For streaming

/**
 * Encrypts a file using AES-256-CBC.
 * @param {string} filePath - Path to the plain-text file.
 * @param {string} encryptedFilePath - Path to save the encrypted file.
 * @param {string} encryptionKey - Key for encryption.
 * @param {string} ivFilePath - Path to save the initialization vector.
 * @returns {Promise<void>}
 */
const encryptFile = async (
  filePath,
  encryptedFilePath,
  encryptionKey,
  ivFilePath
) => {
  const iv = crypto.randomBytes(16); // Generate IV

  // Save IV to a file asynchronously
  await fs.writeFile(ivFilePath, iv);

  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );
  const input = createReadStream(filePath);
  const output = createWriteStream(encryptedFilePath);

  // Pipe the input through the cipher into the output
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
};

/**
 * Decrypts an encrypted file using AES-256-CBC.
 * @param {string} encryptedFilePath - Path to the encrypted backup file.
 * @param {string} decryptedFilePath - Path to save the decrypted SQL file.
 * @param {string} encryptionKey - Key used for decryption.
 * @param {string} ivFilePath - Path to the initialization vector file.
 * @returns {Promise<void>}
 */
const decryptFile = async (
  encryptedFilePath,
  decryptedFilePath,
  encryptionKey,
  ivFilePath
) => {
  // Check if IV file exists asynchronously
  try {
    await fs.access(ivFilePath);
  } catch (err) {
    throw AppError.notFoundError(`Initialization Vector (IV) file not found: ${ivFilePath}`);
  }

  // Load IV asynchronously
  const iv = await fs.readFile(ivFilePath);

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv
  );
  const input = createReadStream(encryptedFilePath);
  const output = createWriteStream(decryptedFilePath);

  // Pipe the input through the decipher into the output
  input.pipe(decipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
};

module.exports = { encryptFile, decryptFile };
