const { withTransaction } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { logSystemException, logSystemWarn } = require('../utils/system-logger');
const { signToken } = require('../utils/token-helper');

/**
 * Authenticates a user using email and password.
 *
 * This service performs a complete, transactional login flow with
 * concurrency safety and security hardening. All authentication state
 * mutations occur within a single database transaction to ensure
 * correctness under concurrent login attempts.
 *
 * Responsibilities:
 * - Fetch and lock the user authentication record
 * - Validate account status and enforce lockout rules
 * - Verify credentials without leaking user existence
 * - Update login attempt counters (success or failure)
 * - Record successful login metadata
 * - Issue access and refresh tokens upon success
 *
 * Security guarantees:
 * - Prevents user enumeration by returning a uniform error message
 *   for invalid credentials.
 * - Enforces account lockout windows deterministically.
 * - Ensures login counters remain consistent under concurrency.
 *
 * Transactional guarantees:
 * - All database operations are executed within a single transaction.
 * - Row-level locking is applied during authentication state evaluation.
 * - Partial updates are not possible; the operation is atomic.
 *
 * @param {string} email - User email address used for authentication.
 * @param {string} password - Plaintext password provided by the user.
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   last_login: Date
 * }>} Authentication tokens and the previous successful login timestamp.
 *
 * @throws {AppError} If authentication fails, the account is locked,
 *                    or a system error occurs.
 */
const loginUserService = async (email, password) => {
  const context = 'auth-service/loginUserService';
  
  return withTransaction(async (client) => {
    try {
      const activeStatusId = getStatusId('general_active');
      
      if (!activeStatusId) {
        throw AppError.validationError('Active status ID is required.');
      }
      
      // ------------------------------------------------------------
      // 1. Fetch & lock auth record (single source of truth)
      // ------------------------------------------------------------
      const auth = await getAndLockUserAuthByEmail(
        email,
        activeStatusId,
        client
      );
      
      const {
        user_id,
        auth_id,
        role_id,
        password_hash,
        last_login,
        attempts,
        failed_attempts,
        lockout_time,
      } = auth;
      
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
          auth_id,
          newTotalAttempts,
          failed_attempts,
          client
        );
        
        // IMPORTANT:
        // Do NOT distinguish between "email not found" and "wrong password"
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      // ------------------------------------------------------------
      // 4. Successful login
      // ------------------------------------------------------------
      await resetFailedAttemptsAndUpdateLastLogin(
        auth_id,
        newTotalAttempts,
        client
      );
      
      // ------------------------------------------------------------
      // 5. Issue tokens
      // ------------------------------------------------------------
      const accessToken = signToken({ id: user_id, role: role_id });
      const refreshToken = signToken(
        { id: user_id, role: role_id },
        true
      );
      
      return {
        accessToken,
        refreshToken,
        last_login,
      };
    } catch (error) {
      // Only log unexpected errors
      if (!error.isExpected) {
        logSystemException(error, 'Unexpected login failure', {
          context,
          email,
          error: error.message,
        });
      }
      
      throw error instanceof AppError
        ? error
        : AppError.generalError('Login failed.');
    }
  });
};

module.exports = {
  loginUserService,
};
