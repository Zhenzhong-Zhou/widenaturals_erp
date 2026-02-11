const { withTransaction } = require('../database/db');
const {
  getAndLockUserAuthByUserId,
} = require('../repositories/user-auth-repository');
const {
  hashPassword,
  verifyPassword,
} = require('../business/user-auth-business');
const {
  logSystemWarn,
  logSystemException, logSystemInfo,
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { validatePasswordStrength } = require('../security/password-policy');
const { logoutSession } = require('../business/auth/session-lifecycle');

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
  client = null
) => {
  const context = 'auth-service/logoutService';
  
  // No active session — nothing to revoke
  if (!userId || !sessionId) {
    return;
  }
  
  try {
    await logoutSession(sessionId, client);
    
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
 * This operation performs a security-critical, stateful mutation of
 * the user's authentication record and MUST be executed within an
 * explicit database transaction.
 *
 * The service enforces multiple security invariants before persisting
 * any changes and guarantees atomic updates under concurrent access.
 *
 * ─────────────────────────────────────────────────────────────
 * Security guarantees
 * ─────────────────────────────────────────────────────────────
 * - Requires verification of the user's current password.
 * - Enforces configured password strength requirements.
 * - Prevents reuse of recently used passwords based on policy.
 * - Does not leak credential validity through differentiated errors.
 *
 * ─────────────────────────────────────────────────────────────
 * Transactional guarantees
 * ─────────────────────────────────────────────────────────────
 * - Acquires a row-level lock on the `user_auth` record at the start
 *   of execution to prevent concurrent password mutations.
 * - Applies password and password history updates atomically.
 * - Ensures password reuse checks observe a consistent history snapshot.
 *
 * ─────────────────────────────────────────────────────────────
 * Architectural guarantees
 * ─────────────────────────────────────────────────────────────
 * - Password mutation is centralized in this service and cannot be
 *   performed through standalone repository helpers.
 * - All security invariants are enforced by construction, not convention.
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
 *   - authenticationError → current password is invalid
 *   - validationError     → password policy or reuse violation
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
      
      const {
        auth_id: authId,
        password_hash,
        metadata,
      } = auth;
      
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
      const passwordHistory =
        metadata?.password_history ?? [];
      
      for (const entry of passwordHistory) {
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
      // 5. Hash new password
      // ------------------------------------------------------------
      const newPasswordHash = await hashPassword(newPassword);
      
      const newHistoryEntry = {
        password_hash: newPasswordHash,
        changed_at: new Date().toISOString(),
      };
      
      const updatedHistory = [
        newHistoryEntry,
        ...passwordHistory,
      ].slice(0, PASSWORD_HISTORY_LIMIT);
      
      // ------------------------------------------------------------
      // 6. Persist password + history atomically
      // ------------------------------------------------------------
      await client.query(
        `
        UPDATE user_auth
        SET
          password_hash = $1,
          metadata = jsonb_set(
            COALESCE(metadata, '{}'),
            '{password_history}',
            $2::jsonb
          ),
          updated_at = NOW()
        WHERE id = $3;
        `,
        [
          newPasswordHash,
          JSON.stringify(updatedHistory),
          authId,
        ]
      );
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
