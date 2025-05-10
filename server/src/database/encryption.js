const crypto = require('crypto');
const fs = require('fs').promises; // Use promise-based fs methods
const { createReadStream, createWriteStream } = require('fs');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger'); // For streaming

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
  
  try {
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
      output.on('finish', () => {
        logSystemInfo('File encryption completed.', {
          context: 'encryption',
          filePath,
          encryptedFilePath,
          ivFilePath,
        });
        resolve();
      });
      output.on('error', (err) => {
        logSystemException(err, 'Error writing encrypted file', {
          context: 'encryption',
          filePath,
          encryptedFilePath,
        });
        reject(err);
      });
    });
  } catch (error) {
    logSystemException(error, 'Encryption failed', {
      context: 'encryption',
      filePath,
      encryptedFilePath,
    });
    throw error;
  }
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
  let iv;
  try {
    // Load IV once
    iv = await fs.readFile(ivFilePath);
  } catch (err) {
    throw AppError.notFoundError(
      `Initialization Vector (IV) file not found: ${ivFilePath}`
    );
  }
 try {
   const decipher = crypto.createDecipheriv(
     'aes-256-cbc',
     Buffer.from(encryptionKey, 'hex'),
     iv
   );
   const input = createReadStream(encryptedFilePath);
   const output = createWriteStream(decryptedFilePath);
   
   // Pipe the input through the deciphering into the output
   input.pipe(decipher).pipe(output);
   
   return new Promise((resolve, reject) => {
     output.on('finish', () => {
       logSystemInfo('File decryption completed.', {
         context: 'decryption',
         encryptedFilePath,
         decryptedFilePath,
         ivFilePath,
       });
       resolve();
     });
     output.on('error', (err) => {
       logSystemException(err, 'Error writing decrypted file', {
         context: 'decryption',
         encryptedFilePath,
         decryptedFilePath,
       });
       reject(err);
     });
   });
 } catch (error) {
   logSystemException(error, 'Decryption failed', {
     context: 'decryption',
     encryptedFilePath,
     decryptedFilePath,
   });
   throw error;
 }
};

module.exports = {
  encryptFile,
  decryptFile,
};
