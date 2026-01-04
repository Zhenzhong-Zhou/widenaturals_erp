const {
  fetchUserAuthForPasswordReset,
  updatePasswordHash,
  updatePasswordHistory,
  fetchPasswordHistory,
} = require('../repositories/user-auth-repository');
const {
  hashPassword,
  verifyPassword,
} = require('../business/user-auth-business');
const { validatePasswordStrength } = require('../security/password-policy');
const AppError = require('../utils/AppError');
const {
  logSystemWarn,
  logSystemException,
} = require('../utils/system-logger');
const { withTransaction } = require('../database/db');

/**
 * Resets a user's password.
 *
 * Security guarantees:
 * - Verifies current password
 * - Enforces password strength
 * - Prevents password reuse
 * - Updates auth + history atomically
 *
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: true }>}
 */
const resetPassword = async (userId, currentPassword, newPassword) => {
  const context = 'auth-service/resetPassword';
  
  return withTransaction(async (client) => {
    try {
      // ------------------------------------------------------------
      // 1. Fetch auth record (single source of truth)
      // ------------------------------------------------------------
      const auth = await fetchUserAuthForPasswordReset(client, userId);
      
      if (!auth) {
        throw AppError.authenticationError('Invalid credentials.');
      }
      
      const { password_hash } = auth;
      
      // ------------------------------------------------------------
      // 2. Verify current password
      // ------------------------------------------------------------
      const isValid = await verifyPassword(
        password_hash,
        currentPassword
      );
      
      if (!isValid) {
        logSystemWarn('Password reset failed: invalid current password', {
          context,
          userId,
        });
        
        throw AppError.authenticationError('Invalid credentials.');
      }
      
      // ------------------------------------------------------------
      // 3. Validate new password strength
      // ------------------------------------------------------------
      validatePasswordStrength(newPassword);
      
      // ------------------------------------------------------------
      // 4. Prevent password reuse
      // ------------------------------------------------------------
      const history = await fetchPasswordHistory(client, userId);
      
      for (const entry of history) {
        const reused = await verifyPassword(
          entry.password_hash,
          newPassword
        );
        
        if (reused) {
          throw AppError.validationError(
            'New password cannot match a previously used password.'
          );
        }
      }
      
      // ------------------------------------------------------------
      // 5. Hash & persist new password
      // ------------------------------------------------------------
      const passwordHash = await hashPassword(newPassword);
      
      await updatePasswordHash(client, userId, passwordHash);
      
      const newHistoryEntry = {
        password_hash: passwordHash,
        changed_at: new Date(),
      };
      
      const updatedHistory = [
        newHistoryEntry,
        ...history,
      ].slice(0, 5);
      
      await updatePasswordHistory(client, userId, updatedHistory);
      
      return { success: true };
    } catch (error) {
      if (!(error instanceof AppError)) {
        logSystemException(error, 'Unexpected password reset failure', {
          context,
          userId,
        });
      }
      
      throw error instanceof AppError
        ? error
        : AppError.generalError('Failed to reset password.');
    }
  });
};

module.exports = { resetPassword };
