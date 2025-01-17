const {
  getUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin, updatePasswordHistory,
  updatePasswordHashAndSalt, fetchPasswordHistory,
} = require('../repositories/user-auth-repository');
const { verifyPassword, hashPasswordWithSalt } = require('../utils/password-helper');
const { signToken } = require('../utils/token-helper');
const AppError = require('../utils/AppError');
const { validateUserExists, validatePasswordReused } = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');
const { getClient } = require('../database/db');

/**
 * Handles user login business logic.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - Access and refresh tokens.
 * @throws {AppError} - If authentication fails or account is locked.
 */
const loginUser = async (email, password) => {
  try {
    // Fetch user authentication details
    const user = await getUserAuthByEmail(email);
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
      lockout_time
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
    if (!isValidPassword) {
      // Increment failed attempts and handle lockout
      await incrementFailedAttempts(user_id, failed_attempts);
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // Successful login: Reset failed attempts and update last login
    await resetFailedAttemptsAndUpdateLastLogin(user_id);
    
    // Generate tokens
    const accessToken = signToken({ id: user_id, role_id: role_id });
    const refreshToken = signToken(
      { id: user_id, role_id: role_id },
      true // Refresh token flag
    );
    
    // Optionally include metadata in the response (if needed for UI or debugging)
    return { accessToken, refreshToken, last_login };
  } catch (error) {
    if (!(error instanceof AppError)) {
      throw AppError.generalError(error.message || 'Login failed.');
    }
    throw error; // Re-throw expected AppError for middleware handling
  }
};

/**
 * Resets the password for a user.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} newPassword - The new password to set.
 * @throws {AppError} - If the user does not exist, password is reused, or other issues occur.
 */
const resetPassword = async (userId, newPassword) => {
  // Acquire a client for the transaction
  const client = await getClient();
  
  try {
    await client.query('BEGIN'); // Start transaction
    
    // Validate the user exists
    await validateUserExists(userId);
    
    // Validate password reuse
    await validatePasswordReused(userId, newPassword);
    
    // Hash the new password
    const { passwordHash, passwordSalt } = await hashPasswordWithSalt(newPassword);
    
    // Fetch the existing password history
    const passwordHistory = await fetchPasswordHistory(userId);
    
    // Prepare the new password entry
    const newPasswordEntry = {
      password_hash: passwordHash,
      password_salt: passwordSalt,
      timestamp: new Date().toISOString(),
    };
    
    // Limit history to the latest 4 entries + the new entry
    const updatedHistory = [newPasswordEntry, ...passwordHistory].slice(0, 5);
    
    // Update the password history
    await updatePasswordHistory(userId, updatedHistory);
    
    // Update the password hash and salt
    await updatePasswordHashAndSalt(userId, passwordHash, passwordSalt);
    
    // Commit the transaction after successful operations
    await client.query('COMMIT');
  } catch (error) {
    // Rollback the transaction in case of errors
    await client.query('ROLLBACK');
    logError('Error resetting password:', error);
    throw error;
  } finally {
    // Always release the client
    client.release();
  }
};

module.exports = { loginUser, resetPassword };
