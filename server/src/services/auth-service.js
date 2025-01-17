const {
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin, updatePasswordHistory,
  updatePasswordHashAndSalt, fetchPasswordHistory, isPasswordReused, verifyCurrentPassword,
} = require('../repositories/user-auth-repository');
const { verifyPassword, hashPasswordWithSalt } = require('../utils/password-helper');
const { signToken } = require('../utils/token-helper');
const AppError = require('../utils/AppError');
const { validateUserExists } = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');
const { withTransaction } = require('../database/db');

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
      const isValidPassword = await verifyPassword(password, passwordhash, passwordsalt);
      if (!isValidPassword) {
        // Increment failed attempts and handle lockout
        await incrementFailedAttempts(client, user_id, failed_attempts);
        throw AppError.authenticationError('Invalid email or password.');
      }
      
      // Successful login: Reset failed attempts and update last login
      await resetFailedAttemptsAndUpdateLastLogin(client, user_id);
      
      // Generate tokens
      const accessToken = signToken({ id: user_id, role_id });
      const refreshToken = signToken({ id: user_id, role_id }, true);
      
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

/**
 * Resets the password for a user.
 *
 * This function ensures secure password reset by validating the user, verifying the
 * current password, checking for password reuse, and updating both the password
 * and password history in the database. The operation is executed within a
 * transaction to maintain atomicity.
 *
 * @param {string} userId - The ID of the user whose password is being reset.
 * @param {string} currentPassword - The user's current password for validation.
 * @param {string} newPassword - The new password to set for the user.
 * @throws {AppError} - Throws an error if:
 *                      - The user does not exist.
 *                      - The current password is invalid.
 *                      - The new password matches a previous password.
 *                      - Any database operation fails.
 */
const resetPassword = async (userId, currentPassword, newPassword) => {
  try {
    return await withTransaction(async (client) => {
      // Validate the user exists
      await validateUserExists(userId);
      
      // Verify the current password
      await verifyCurrentPassword(client, userId, currentPassword);
      
      // Validate password reuse
      const isReused = await isPasswordReused(client, userId, newPassword);
      if (isReused) {
        throw new AppError('New password cannot be the same as a previously used password.', 400, {
            type: 'ValidationError',
            isExpected: true,
          }
        );
      }
      
      // Hash the new password
      const { passwordHash, passwordSalt } = await hashPasswordWithSalt(newPassword);
      
      // Fetch the existing password history
      const passwordHistory = await fetchPasswordHistory(client, userId);
      
      // Prepare the new password entry
      const newPasswordEntry = {
        password_hash: passwordHash,
        password_salt: passwordSalt,
        timestamp: new Date().toISOString(),
      };
      
      // Limit history to the latest 4 entries + the new entry
      const updatedHistory = [newPasswordEntry, ...passwordHistory].slice(0, 5);
      
      // Update the password history
      await updatePasswordHistory(client, userId, updatedHistory);
      
      // Update the password hash and salt
      await updatePasswordHashAndSalt(client, userId, passwordHash, passwordSalt);
      
      return { success: true };
    });
  } catch (error) {
    logError('Error resetting password:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to reset password', 500, { type: 'DatabaseError' });
  }
};

module.exports = { loginUser, resetPassword };
