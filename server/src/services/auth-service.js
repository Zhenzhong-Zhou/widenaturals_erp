const {
  updatePasswordHistory,
  updatePasswordHashAndSalt,
  fetchPasswordHistory,
  isPasswordReused,
  verifyCurrentPassword,
} = require('../repositories/user-auth-repository');
const { hashPassword } = require('../business/user-auth-business');
const AppError = require('../utils/AppError');
const { validateUserExists } = require('../validators/db-validators');
const { logError } = require('../utils/logger-helper');
const { withTransaction } = require('../database/db');

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
      await validateUserExists('id', userId);

      // Verify the current password
      const isMath = await verifyCurrentPassword(
        client,
        userId,
        currentPassword
      );

      if (!isMath) {
        throw AppError.notFoundError('Current password cannot be matched');
      }

      // Validate password reuse
      const isReused = await isPasswordReused(client, userId, newPassword);
      if (isReused) {
        throw AppError.notFoundError(
          'New password cannot be the same as a previously used password.'
        );
      }
      
      // Hash the new password
      const { passwordHash } =
        await hashPassword(newPassword);

      // Fetch the existing password history
      const passwordHistory = await fetchPasswordHistory(client, userId);

      // Prepare the new password entry
      const newPasswordEntry = {
        password_hash: passwordHash,
        timestamp: new Date().toISOString(),
      };

      // Limit history to the latest 4 entries + the new entry
      const updatedHistory = [newPasswordEntry, ...passwordHistory].slice(0, 5);

      // Update the password history
      await updatePasswordHistory(client, userId, updatedHistory);

      // Update the password hash and salt
      await updatePasswordHashAndSalt(
        client,
        userId,
        passwordHash,
      );

      return { success: true };
    });
  } catch (error) {
    logError('Error resetting password:', error);
    throw error instanceof AppError
      ? error
      : new AppError('Failed to reset password', 500, {
          type: 'DatabaseError',
        });
  }
};

module.exports = { resetPassword };
