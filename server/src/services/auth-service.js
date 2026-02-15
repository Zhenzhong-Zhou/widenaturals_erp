const { withTransaction } = require('../database/db');
const {
  getAndLockUserAuthByUserId,
  updatePasswordAndHistory,
} = require('../repositories/user-auth-repository');
const {
  hashPassword,
  verifyPassword,
} = require('../business/user-auth-business');
const {
  logSystemWarn,
  logSystemException,
  logSystemInfo,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { validatePasswordStrength } = require('../security/password-policy');
const {
  logoutSession,
  revokeAllSessionsForUser,
} = require('../business/auth/session-lifecycle');

/**
 * Logs out a user by fully revoking the active session.
 *
 * Responsibilities:
 * - Revoke the current session
 * - Revoke all tokens associated with that session
 * - Record logout intent for audit purposes
 *
 * Security semantics:
 * - After this operation, refresh and access tokens MUST NOT be usable
 * - Safe to call multiple times (idempotent)
 * - Absence of an active session is NOT an error
 *
 * @param {{
 *   userId: string,
 *   sessionId: string | null
 * }} params
 *
 * @param {Object|null} client
 *
 * @returns {Promise<void>}
 */
const logoutService = async (
  { userId, sessionId },
  { ipAddress, userAgent }
) => {
  const context = 'auth-service/logoutService';

  // No active session — nothing to revoke
  if (!userId || !sessionId) {
    return;
  }

  try {
    await logoutSession({
      sessionId,
      ipAddress,
      userAgent,
    });

    logSystemInfo('User logged out', {
      context,
      userId,
      sessionId,
    });
  } catch (error) {
    logSystemException(error, 'Failed to logout user', {
      context,
      userId,
      sessionId,
    });
    throw error;
  }
};

const PASSWORD_HISTORY_LIMIT = 5;

/**
 * Changes an authenticated user's password.
 *
 * This operation performs a security-critical mutation of the user's
 * authentication record and MUST execute within a single database
 * transaction.
 *
 * ─────────────────────────────────────────────────────────────
 * Security guarantees
 * ─────────────────────────────────────────────────────────────
 * - Requires verification of the current password.
 * - Enforces configured password strength requirements.
 * - Prevents reuse of recently used passwords.
 * - Revokes all active sessions and tokens upon successful update.
 * - Does not leak credential validity through differentiated errors.
 *
 * ─────────────────────────────────────────────────────────────
 * Transactional guarantees
 * ─────────────────────────────────────────────────────────────
 * - Acquires a row-level lock on the `user_auth` record.
 * - Applies password and password history updates atomically.
 * - Revokes sessions and tokens within the same transaction.
 * - Ensures password reuse checks observe a consistent snapshot.
 *
 * ─────────────────────────────────────────────────────────────
 * Architectural guarantees
 * ─────────────────────────────────────────────────────────────
 * - Password mutation logic is centralized in this service.
 * - Repository layer performs persistence only.
 * - All security invariants are enforced by construction.
 *
 * @param {string} userId
 *   ID of the authenticated user requesting the password change.
 *
 * @param {string} currentPassword
 *   The user's existing password, required to authorize the change.
 *
 * @param {string} newPassword
 *   The new password to be set for the user.
 *
 * @returns {Promise<void>}
 *   Resolves when the password change completes successfully.
 *
 * @throws {AppError}
 *   - authenticationError → invalid credentials
 *   - validationError     → password policy violation
 *   - notFoundError       → inconsistent authentication state
 *   - generalError        → unexpected system failure
 */
const changePasswordService = async (userId, currentPassword, newPassword) => {
  const context = 'auth-service/changePasswordService';

  return withTransaction(async (client) => {
    try {
      // ------------------------------------------------------------
      // 1. Fetch & lock auth record (single source of truth)
      // ------------------------------------------------------------
      const auth = await getAndLockUserAuthByUserId(userId, client);

      const { auth_id: authId, password_hash, metadata } = auth;

      // ------------------------------------------------------------
      // 2. Verify current password
      // ------------------------------------------------------------
      const isValid = await verifyPassword(password_hash, currentPassword);

      if (!isValid) {
        logSystemWarn('Password reset failed: invalid current password', {
          context,
          userId,
          hint: 'Current password does not match stored hash',
        });

        throw AppError.authenticationError('Invalid credentials.');
      }

      // ------------------------------------------------------------
      // 3. Validate new password strength
      // ------------------------------------------------------------
      validatePasswordStrength(newPassword);

      // ------------------------------------------------------------
      // 4. Enforce password reuse policy (if enabled)
      // ------------------------------------------------------------
      const passwordHistory = metadata?.password_history ?? [];

      for (const entry of passwordHistory) {
        const reused = await verifyPassword(entry.password_hash, newPassword);

        if (reused) {
          throw AppError.validationError(
            'New password cannot match a previously used password.'
          );
        }
      }

      // ------------------------------------------------------------
      // 5. Hash new password
      // ------------------------------------------------------------
      const newPasswordHash = await hashPassword(newPassword);

      const newHistoryEntry = {
        password_hash: newPasswordHash,
        changed_at: new Date().toISOString(),
      };

      const updatedHistory = [newHistoryEntry, ...passwordHistory].slice(
        0,
        PASSWORD_HISTORY_LIMIT
      );

      // ------------------------------------------------------------
      // 6. Persist password + history atomically
      // ------------------------------------------------------------
      const result = await updatePasswordAndHistory(
        authId,
        newPasswordHash,
        updatedHistory,
        client
      );

      if (!result) {
        throw AppError.notFoundError('Authentication record not found.');
      }

      // ------------------------------------------------------------
      // 7. Revoke all active sessions and tokens (security boundary)
      // ------------------------------------------------------------
      await revokeAllSessionsForUser(userId, client);
    } catch (error) {
      if (!error.isExpected) {
        logSystemException(error, 'Unexpected password reset failure', {
          context,
          userId,
          error: error.message,
        });
      }

      throw error instanceof AppError
        ? error
        : AppError.generalError('Failed to reset password.');
    }
  });
};

module.exports = {
  logoutService,
  changePasswordService,
};
