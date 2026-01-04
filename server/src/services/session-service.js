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

/**
 * Authenticates a user using email and password.
 *
 * Responsibilities:
 * - Verify credentials
 * - Enforce lockout rules
 * - Update login counters
 * - Issue access & refresh tokens
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, last_login: Date }>}
 */
const loginUser = async (email, password) => {
  return withTransaction(async (client) => {
    const context = 'auth-service/loginUser';
    
    try {
      // ------------------------------------------------------------
      // 1. Fetch auth record (single source of truth)
      // ------------------------------------------------------------
      const user = await getUserAuthByEmail(client, email);
      
      // IMPORTANT:
      // Do NOT distinguish between "email not found" and "wrong password"
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
      
      // ------------------------------------------------------------
      // 2. Lockout check
      // ------------------------------------------------------------
      if (lockout_time && new Date(lockout_time) > new Date()) {
        throw AppError.accountLockedError(
          'Account locked. Try again later.',
          { lockoutEndsAt: lockout_time }
        );
      }
      
      // ------------------------------------------------------------
      // 3. Verify password
      // ------------------------------------------------------------
      const isValidPassword = await verifyPassword(
        password_hash,
        password
      );
      
      const newTotalAttempts = attempts + 1;
      
      if (!isValidPassword) {
        logSystemWarn('Login failed: invalid credentials', {
          context,
          email,
        });
        
        await incrementFailedAttempts(
          client,
          user_id,
          newTotalAttempts,
          failed_attempts
        );
        
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      // ------------------------------------------------------------
      // 4. Successful login
      // ------------------------------------------------------------
      await resetFailedAttemptsAndUpdateLastLogin(
        client,
        user_id,
        newTotalAttempts
      );
      
      // ------------------------------------------------------------
      // 5. Issue tokens
      // ------------------------------------------------------------
      const accessToken = signToken({ id: user_id, role: role_id });
      const refreshToken = signToken({ id: user_id, role: role_id }, true);
      
      return {
        accessToken,
        refreshToken,
        last_login,
      };
    } catch (error) {
      // Only log unexpected errors as system exceptions
      if (!(error instanceof AppError)) {
        logSystemException(error, 'Unexpected login failure', {
          context,
          email,
        });
      }
      
      throw error instanceof AppError
        ? error
        : AppError.generalError('Login failed.');
    }
  });
};

module.exports = { loginUser };
