const crypto = require('crypto');
const argon2 = require('argon2');
const { logError } = require('./logger-helper');

/**
 * Hashes a password with a unique salt using Argon2.
 * @param {string} password - The plain text password.
 * @returns {Promise<object>} - An object containing the password hash and salt.
 */
const hashPasswordWithSalt = async (password) => {
  try {
    // Generate a unique salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Combine the password and salt before hashing
    const hash = await argon2.hash(password + salt);
    
    return {
      passwordHash: hash,
      passwordSalt: salt,
    };
  } catch (error) {
    throw new Error('Failed to hash password with salt.');
  }
};

/**
 * Verifies a password against its hash and salt using Argon2.
 * @param {string} password - The plain text password.
 * @param {string} passwordHash - The hashed password.
 * @param {string} passwordSalt - The salt used for hashing.
 * @returns {Promise<boolean>} - True if the password matches the hash, otherwise false.
 */
const verifyPassword = async (password, passwordHash, passwordSalt) => {
  if (!password || !passwordHash || !passwordSalt) {
    throw new Error('Invalid password, hash, or salt provided.');
  }
  
  try {
    // Concatenate the password with the salt
    const combinedPassword = password + passwordSalt;
    
    // Verify the hash
    return await argon2.verify(passwordHash, combinedPassword);
  } catch (error) {
    logError('Password verification failed:', error.message);
    throw new Error('Failed to verify password.');
  }
};

module.exports = { hashPasswordWithSalt, verifyPassword };
