const {
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../utils/password-helper');
const { signToken } = require('../utils/token-helper');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
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
  return await withTransaction(async (client) => {
    try {
      await validateUserExists('email', email);

      // Fetch user authentication details
      const user = await getUserAuthByEmail(client, email);
      if (!user) {
        throw AppError.authenticationError('Invalid email or password.');
      }

      const {
        user_id,
        role_id,
        passwordhash,
        passwordsalt,
        last_login,
        attempts,
        failed_attempts,
        lockout_time,
      } = user;

      // Check if account is locked
      if (lockout_time && new Date(lockout_time) > new Date()) {
        throw AppError.accountLockedError('Account locked. Try again later.', {
          code: 'ACCOUNT_LOCKED',
          lockoutEndsAt: lockout_time,
        });
      }

      // Verify the password
      const isValidPassword = await verifyPassword(
        password,
        passwordhash,
        passwordsalt
      );

      // Update total attempts regardless of success or failure
      const newTotalAttempts = attempts + 1;

      if (!isValidPassword) {
        console.warn(
          'Password verification failed. Incrementing failed attempts.'
        );

        // Increment failed attempts and handle lockout
        await incrementFailedAttempts(
          client,
          user_id,
          newTotalAttempts,
          failed_attempts
        );

        // Commit the transaction before throwing
        await client.query('COMMIT');

        throw AppError.authenticationError('Invalid email or password.');
      }

      // Successful login: Reset failed attempts and update last login
      await resetFailedAttemptsAndUpdateLastLogin(
        client,
        user_id,
        newTotalAttempts
      );

      // Generate tokens
      const accessToken = signToken({ id: user_id, role: role_id });
      const refreshToken = signToken({ id: user_id, role: role_id }, true);

      return { accessToken, refreshToken, last_login };
    } catch (error) {
      // Log unexpected errors for debugging
      logError('Error during user login:', { email, error });

      if (error instanceof AppError) {
        throw error; // Re-throw expected AppError
      } else {
        throw AppError.generalError(error.message || 'Login failed.');
      }
    }
  });
};

module.exports = { loginUser };
