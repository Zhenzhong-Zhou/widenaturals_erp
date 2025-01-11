const crypto = require('crypto');
const argon2 = require('argon2');
const { logError } = require('./logger-helper');
const AppError = require('./app-error');

/**
 * Hashes a password with a unique salt using Argon2.
 * @param {string} password - The plain text password.
 * @returns {Promise<object>} - An object containing the password hash and salt.
 * @throws {AppError} - If hashing the password fails.
 */
const hashPasswordWithSalt = async (password) => {
  try {
    if (!password) {
      throw AppError.validationError('Password is required for hashing.');
    }
    
    // Generate a unique salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Combine the password and salt before hashing
    const hash = await argon2.hash(password + salt);
    
    return {
      passwordHash: hash,
      passwordSalt: salt,
    };
  } catch (error) {
    logError('Error during password hashing:', { message: error.message });
    throw AppError.hashError('Failed to hash password.', {
      details: { error: error.message },
    });
  }
};

/**
 * Verifies a password against its hash and salt using Argon2.
 * @param {string} password - The plain text password.
 * @param {string} passwordHash - The hashed password.
 * @param {string} passwordSalt - The salt used for hashing.
 * @returns {Promise<boolean>} - True if the password matches the hash, otherwise false.
 * @throws {AppError} - If verification fails or input data is invalid.
 */
const verifyPassword = async (password, passwordHash, passwordSalt) => {
  try {
    if (!password || !passwordHash || !passwordSalt) {
      throw AppError.validationError('Invalid password, hash, or salt provided.', {
        details: { password, passwordHash, passwordSalt },
      });
    }
    
    // Concatenate the password with the salt
    const combinedPassword = password + passwordSalt;
    
    // Verify the hash
    return await argon2.verify(passwordHash, combinedPassword);
  } catch (error) {
    logError('Error during password verification:', { message: error.message });
    throw AppError.hashError('Failed to verify password.', {
      details: { error: error.message },
    });
  }
};

module.exports = { hashPasswordWithSalt, verifyPassword };
