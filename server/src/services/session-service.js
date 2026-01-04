const {
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { signToken } = require('../utils/token-helper');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemWarn } = require('../utils/system-logger');
const { withTransaction } = require('../database/db');
const { validateUserExists } = require('../validators/db-validators');

/**
 * Handles user login business logic.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - Access and refresh tokens.
 * @throws {AppError} - If authentication fails or account is locked.
 */
const loginUser = async (email, password) => {
  return withTransaction(async (client) => {
    try {
      await validateUserExists('email', email);
      
      const user = await getUserAuthByEmail(client, email);
      if (!user) {
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      const {
        user_id,
        role_id,
        password_hash,
        last_login,
        attempts,
        failed_attempts,
        lockout_time,
      } = user;
      
      // Check lockout
      if (lockout_time && new Date(lockout_time) > new Date()) {
        throw AppError.accountLockedError(
          'Account locked. Try again later.',
          { lockoutEndsAt: lockout_time }
        );
      }
      
      // Correct password verification
      const isValidPassword = await verifyPassword(
        password_hash,
        password
      );
      
      const newTotalAttempts = attempts + 1;
      
      if (!isValidPassword) {
        logSystemWarn('Password verification failed.');
        
        await incrementFailedAttempts(
          client,
          user_id,
          newTotalAttempts,
          failed_attempts
        );
        
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      // Successful login
      await resetFailedAttemptsAndUpdateLastLogin(
        client,
        user_id,
        newTotalAttempts
      );
      
      const accessToken = signToken({ id: user_id, role: role_id });
      const refreshToken = signToken({ id: user_id, role: role_id }, true);
      
      return { accessToken, refreshToken, last_login };
    } catch (error) {
      logSystemException(error,'Error during user login', {
        email,
        error: error.message,
      });
      
      throw error instanceof AppError
        ? error
        : AppError.generalError('Login failed.');
    }
  });
};

module.exports = { loginUser };
