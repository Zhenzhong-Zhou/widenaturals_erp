/**
 * @file auth-service.js
 * @description Business logic for authentication lifecycle operations.
 *
 * Exports:
 *   - loginUserService        – authenticates a user and issues session tokens
 *   - refreshTokenService     – rotates a refresh token and issues new tokens
 *
 * Error handling follows a single-log principle — errors are not logged here
 * except where noted below.
 *
 * Special cases:
 *   - Missing password hash is logged with `logSystemException` before throwing —
 *     it indicates a data integrity issue that warrants an internal alert.
 *   - Post-commit audit logging failure is caught and logged with `logSystemWarn` —
 *     it must never fail the login response.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction }                    = require('../database/db');
const { getStatusId }                        = require('../config/status-cache');
const AppError                               = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
}                                            = require('../repositories/user-auth-repository');
const { verifyPassword }                     = require('../business/user-auth-business');
const {
  logSystemWarn,
  logSystemException,
}                                            = require('../utils/logging/system-logger');
const { signToken, verifyRefreshJwt }        = require('../utils/auth/jwt-utils');
const { transformLoginResponse }             = require('../transformers/session-transformer');
const {
  issueSessionWithTokens,
  revokeAllSessionsForUser,
}                                            = require('../business/auth/session-lifecycle');
const { insertLoginHistory }                 = require('../repositories/login-history-repository');
const { insertTokenActivityLog }             = require('../repositories/token-activity-log-repository');
const { validateRefreshTokenState }          = require('../utils/auth/validate-token');
const { validateSessionState }               = require('../utils/auth/validate-session');
const { revokeTokenById, insertToken }       = require('../repositories/token-repository');
const { hashToken }                          = require('../utils/auth/token-hash');
const { getTokenExpiry }                     = require('../utils/auth/token-expiry');
const { getAuthUserById }                    = require('../repositories/user-repository');

const CONTEXT = 'auth-service';

/**
 * Authenticates a user by email and password, issues a session with tokens,
 * and records login history.
 *
 * Enforces single-session policy — all existing sessions are revoked on
 * successful login. Login history is recorded for both successful and
 * failed attempts. Post-commit audit logging is best-effort and will not
 * fail the login response if it errors.
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} [options]
 * @param {string|null} [options.ipAddress]
 * @param {string|null} [options.userAgent]
 * @param {string|null} [options.deviceId]
 * @param {Object|null} [options.parsedUserAgent]
 *
 * @returns {Promise<Object>} Transformed login response with access and refresh tokens.
 *
 * @throws {AppError} `authenticationError`  – invalid credentials or missing password hash.
 * @throws {AppError} `accountLockedError`   – account is currently locked.
 * @throws {AppError} `validationError`      – active status ID not available.
 * @throws {AppError} `generalError`         – login succeeded but token issuance failed.
 */
const loginUserService = async (
  email,
  password,
  { ipAddress = null, userAgent = null, deviceId = null, parsedUserAgent = null } = {}
) => {
  const context = `${CONTEXT}/loginUserService`;
  
  let issued; // captured for post-commit audit log
  let userId; // captured for post-commit audit log
  
  const response = await withTransaction(async (client) => {
    const activeStatusId = getStatusId('general_active');
    
    if (!activeStatusId) {
      throw AppError.validationError('Active status ID is required.');
    }
    
    // 1. Fetch and lock auth record by email.
    const auth = await getAndLockUserAuthByEmail(email, activeStatusId, client);
    
    if (!auth) {
      await insertLoginHistory(
        {
          userId:           null,
          sessionId:        null,
          tokenId:          null,
          authActionTypeId: getStatusId('Invalid Credentials'),
          status:           'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      // Do not reveal whether the email exists or the account is inactive.
      throw AppError.authenticationError('Invalid email or password.');
    }
    
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
    
    userId = user_id;
    
    // 2. Lockout check — reject before password verification.
    if (lockout_time && lockout_time > new Date()) {
      await insertLoginHistory(
        {
          userId:           user_id,
          sessionId:        null,
          tokenId:          null,
          authActionTypeId: getStatusId('Account Locked'),
          status:           'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      throw AppError.accountLockedError('Account locked. Try again later.', {
        lockoutEndsAt: lockout_time,
      });
    }
    
    // 3. Guard against missing password hash — data integrity issue, log internally.
    if (!password_hash) {
      // logSystemException used here — missing hash indicates a data integrity
      // problem that warrants an internal alert, not just a client error.
      logSystemException(
        new Error('Missing password hash during login'),
        'Auth record has no password hash',
        { context, userId: user_id, authId: auth_id }
      );
      
      // Do not expose internal state to the client.
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 4. Verify password and track attempts.
    const isValidPassword  = await verifyPassword(password_hash, password);
    const newTotalAttempts = attempts + 1;
    
    if (!isValidPassword) {
      await incrementFailedAttempts(auth_id, newTotalAttempts, failed_attempts, client);
      
      await insertLoginHistory(
        {
          userId:           user_id,
          sessionId:        null,
          tokenId:          null,
          authActionTypeId: getStatusId('Invalid Credentials'),
          status:           'failure',
          ipAddress,
          userAgent,
        },
        client
      );
      
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 5. Successful login — reset failed attempts and update last login.
    await resetFailedAttemptsAndUpdateLastLogin(auth_id, newTotalAttempts, client);
    
    // Enforce single-session policy — revoke all existing sessions and tokens.
    await revokeAllSessionsForUser(user_id, client);
    
    // 6. Issue session and tokens.
    issued = await issueSessionWithTokens(
      {
        userId:         user_id,
        roleId:         role_id,
        ipAddress,
        userAgent,
        deviceId,
        parsedUserAgent,
      },
      client
    );
    
    if (!issued) {
      throw AppError.generalError('Login succeeded but no tokens were issued.');
    }
    
    return transformLoginResponse({
      accessToken:  issued.accessToken,
      refreshToken: issued.refreshToken,
      last_login,
    });
  });
  
  // Post-commit audit log — best effort, must not fail the login response.
  try {
    await insertLoginHistory(
      {
        userId,
        sessionId:        issued.sessionId,
        tokenId:          issued.refreshTokenId,
        authActionTypeId: getStatusId('login_success'),
        status:           'success',
        ipAddress,
        userAgent,
      },
      null
    );
  } catch (logError) {
    logSystemWarn('Post-login audit logging failed', {
      context,
      userId,
      error: logError.message,
    });
  }
  
  return response;
};

/**
 * Validates a refresh token, rotates it, and issues new access and refresh tokens.
 *
 * Revokes the current refresh token on rotation to prevent replay attacks
 * during concurrent refresh attempts.
 *
 * @param {string} refreshToken
 * @param {Object} [options]
 * @param {string|null} [options.ipAddress]
 * @param {string|null} [options.userAgent]
 *
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 *
 * @throws {AppError} `refreshTokenError`    – token missing, invalid, expired, or revoked.
 * @throws {AppError} `authenticationError`  – user not found or inactive.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const refreshTokenService = async (
  refreshToken,
  { ipAddress = null, userAgent = null } = {}
) => {
  const context = `${CONTEXT}/refreshTokenService`;
  
  if (!refreshToken) {
    throw AppError.refreshTokenError('Refresh token is required. Please log in again.');
  }
  
  // Verify JWT cryptographic validity only — persistence and revocation enforced below.
  const payload = verifyRefreshJwt(refreshToken);
  
  if (!payload?.id || !payload?.sessionId) {
    throw AppError.refreshTokenError('Invalid refresh token payload.');
  }
  
  try {
    return await withTransaction(async (client) => {
      const user = await getAuthUserById(payload.id, client);
      
      if (!user) {
        throw AppError.authenticationError('User not found.');
      }
      
      if (user.status_name !== 'active') {
        throw AppError.authenticationError('User account is inactive.');
      }
      
      // 1. Validate refresh token persistence state (not revoked, not expired).
      const token = await validateRefreshTokenState(refreshToken, client);
      
      // 2. Validate associated session (active, not expired).
      const session = await validateSessionState(token.session_id, client);
      
      // 3. Revoke current refresh token to prevent replay on concurrent requests.
      await revokeTokenById(token.id, client);
      
      await insertTokenActivityLog(
        {
          userId:    payload.id,
          tokenId:   token.id,
          eventType: 'revoke',
          status:    'success',
          tokenType: 'refresh',
          ipAddress,
          userAgent,
        },
        client
      );
      
      // 4. Issue new access and refresh tokens.
      const newAccessToken = signToken({
        id:        payload.id,
        role:      user.role_id,
        sessionId: session.id,
      });
      
      const newRefreshToken = signToken(
        {
          id:        payload.id,
          sessionId: session.id,
          jti:       crypto.randomUUID(),
        },
        true
      );
      
      // 5. Persist new refresh token.
      const refreshTokenHash = hashToken(newRefreshToken);
      
      const newTokenRow = await insertToken(
        {
          userId:    payload.id,
          sessionId: session.id,
          tokenType: 'refresh',
          tokenHash: refreshTokenHash,
          expiresAt: getTokenExpiry(true),
          context:   'refresh',
        },
        client
      );
      
      await insertTokenActivityLog(
        {
          userId:    payload.id,
          tokenId:   newTokenRow.id,
          eventType: 'refresh',
          status:    'success',
          tokenType: 'refresh',
          ipAddress,
          userAgent,
        },
        client
      );
      
      return {
        accessToken:  newAccessToken,
        refreshToken: newRefreshToken,
      };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to refresh token.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  loginUserService,
  refreshTokenService,
};
