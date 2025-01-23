const crypto = require('crypto');
const fs = require('fs');

/**
 * Encrypts a file using AES-256-CBC.
 * @param {string} filePath - Path to the plain-text file.
 * @param {string} encryptedFilePath - Path to save the encrypted file.
 * @param {string} encryptionKey - Key for encryption.
 * @param {string} ivFilePath - Path to save the initialization vector.
 * @returns {Promise<void>}
 */
const encryptFile = (filePath, encryptedFilePath, encryptionKey, ivFilePath) => {
  const iv = crypto.randomBytes(16); // Generate IV
  fs.writeFileSync(ivFilePath, iv); // Save IV to a file
  
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(encryptedFilePath);
  
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
const decryptFile = (encryptedFilePath, decryptedFilePath, encryptionKey, ivFilePath) => {
  if (!fs.existsSync(ivFilePath)) {
    throw new Error(`Initialization Vector (IV) file not found: ${ivFilePath}`);
  }
  
  const iv = fs.readFileSync(ivFilePath); // Load IV
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  
  const input = fs.createReadStream(encryptedFilePath);
  const output = fs.createWriteStream(decryptedFilePath);
  
  input.pipe(decipher).pipe(output);
  
  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
};


module.exports = { encryptFile, decryptFile };
