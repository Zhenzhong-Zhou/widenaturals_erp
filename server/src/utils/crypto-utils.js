const crypto = require('crypto');

/**
 * Generates a random token.
 * @param {number} length - The length of the token.
 * @returns {string} - The generated token.
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypts data using AES-256.
 * @param {string} data - The data to encrypt.
 * @param {string} secret - The secret key for encryption.
 * @returns {string} - The encrypted data in base64 format.
 */
const encryptData = (data, secret) => {
  const cipher = crypto.createCipher('aes-256-cbc', secret);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * Decrypts data using AES-256.
 * @param {string} encryptedData - The encrypted data in base64 format.
 * @param {string} secret - The secret key for decryption.
 * @returns {string} - The decrypted data.
 */
const decryptData = (encryptedData, secret) => {
  const decipher = crypto.createDecipher('aes-256-cbc', secret);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Hashes general data using SHA-256.
 * @param {string} data - The data to hash.
 * @returns {string} - The SHA-256 hash in hex format.
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = { generateRandomToken, encryptData, decryptData, hashData };
