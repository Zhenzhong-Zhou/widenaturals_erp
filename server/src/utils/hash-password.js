const crypto = require('crypto');
const argon2 = require('argon2');

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
  return argon2.verify(passwordHash, password + passwordSalt);
};

module.exports = { hashPasswordWithSalt, verifyPassword };
