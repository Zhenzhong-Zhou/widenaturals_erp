const argon2 = require('argon2');
const { loadEnv } = require('../config/env');
const AppError = require('./AppError');
const { logSystemException } = require('./logging/system-logger');

// Load environment variables
loadEnv();

const PEPPER = process.env.PASSWORD_PEPPER;

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
