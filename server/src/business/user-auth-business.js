const argon2 = require('argon2');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

// Load environment variables
loadEnv();

const PEPPER = process.env.PASSWORD_PEPPER;

/**
 * Hashes a plaintext password using Argon2id.
 *
 * Security characteristics:
 * - Uses Argon2 built-in random salt (no manual salt storage)
 * - Applies a server-side pepper (PASSWORD_PEPPER)
 * - Uses memory-hard parameters to resist GPU/ASIC attacks
 *
 * Notes:
 * - The returned hash embeds salt and parameters
 * - Plaintext passwords must never be stored or logged
 * - PASSWORD_PEPPER must be configured at runtime
 *
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} passwordHash
 *
 * @throws {AppError} If hashing fails or password is missing
 */
const hashPassword = async (password) => {
  if (!password) {
    throw AppError.validationError('Password is required.');
  }

  try {
    return await argon2.hash(password + PEPPER, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  } catch (error) {
    logSystemException(error, 'Password hashing failed');
    throw AppError.hashError('Failed to hash password.');
  }
};

/**
 * Verifies a plaintext password against a stored Argon2 hash.
 *
 * Security characteristics:
 * - Uses Argon2 embedded salt and parameters from the stored hash
 * - Applies a server-side pepper (PASSWORD_PEPPER)
 * - Returns a boolean result only (no error leakage)
 *
 * Behavior notes:
 * - Returns `false` for invalid passwords or verification errors
 * - Does NOT throw on verification failure to avoid leaking details
 * - Intended for authentication / login flows
 *
 * @param {string} storedHash - Password hash stored in the database
 * @param {string} inputPassword - Plaintext password provided by the user
 * @returns {Promise<boolean>} `true` if password is valid, otherwise `false`
 */
const verifyPassword = async (storedHash, inputPassword) => {
  try {
    if (typeof storedHash !== 'string' || typeof inputPassword !== 'string') {
      return false;
    }

    return await argon2.verify(storedHash, inputPassword + PEPPER);
  } catch (error) {
    logSystemException(error, 'Password verification failed');
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
};
