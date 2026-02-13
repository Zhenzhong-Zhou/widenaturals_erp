const { withTransaction } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { logSystemWarn, logSystemInfo, logSystemError } = require('../utils/system-logger');
const { signToken, verifyRefreshJwt } = require('../utils/auth/jwt-utils');
const { transformLoginResponse } = require('../transformers/session-transformer');
const { issueSessionWithTokens, revokeAllSessionsForUser } = require('../business/auth/session-lifecycle');
const { insertLoginHistory } = require('../repositories/login-history-repository');
const { insertTokenActivityLog } = require('../repositories/token-activity-log-repository');
const { validateRefreshTokenState } = require('../utils/auth/validate-token');
const { validateSessionState } = require('../utils/auth/validate-session');
const { revokeTokenById, insertToken } = require('../repositories/token-repository');
const { hashToken } = require('../utils/auth/token-hash');
const { getTokenExpiry } = require('../utils/auth/token-expiry');
const { getAuthUserById } = require('../repositories/user-repository');

/**
 * Authenticates a user using email and password.
 *
 * Guarantees:
 * - All authentication state mutations occur within a single database transaction
 * - Session revocation and new session issuance are atomic
 * - Enforces a strict single-session policy (all prior sessions revoked across devices)
 * - Returns a finalized, API-ready response on success
 * - Post-commit audit logging is best-effort and never affects control flow
 *
 * Authentication model:
 * - Password-based authentication only
 * - Latest successful login invalidates all prior sessions and refresh tokens
 * - Access tokens are short-lived and stateless
 * - Refresh tokens are stateful and persisted as secure hashes
 *
 * Security properties:
 * - Does NOT reveal whether an email exists or is inactive
 * - May reveal lockout state only after valid account identification
 * - Does NOT expose session identifiers or token identifiers
 * - Does NOT persist raw tokens (hashes only)
 *
 * Notes:
 * - deviceId and note are optional metadata for auditing and future policy enforcement
 * - Lockout duration and failed-attempt thresholds are enforced at the auth layer
 * - Audit logging after commit is intentionally non-blocking
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} context
 * @param {string|null} context.ipAddress
 * @param {string|null} context.userAgent
 * @param {string|null} context.deviceId
 * @param {string|null} context.note
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   lastLogin: string | null
 * }>}
 *
 * @throws {AppError}
 * - authenticationError
 * - accountLockedError
 * - validationError
 * - generalError
 */
const loginUserService = async (
  email,
  password,
  {
    ipAddress = null,
    userAgent = null,
    deviceId = null,
    note = null,
  } = {}
) => {
  const context = 'auth-service/loginUserService';
  
  let issued;     // used for post-commit logging
  let userId;     // used for post-commit logging
  
  // ------------------------------------------------------------
  // Transactional auth flow
  // ------------------------------------------------------------
  const response = await withTransaction(async (client) => {
    const activeStatusId = getStatusId('general_active');
    if (!activeStatusId) {
      throw AppError.validationError('Active status ID is required.');
    }
    
    // 1. Fetch & lock auth record
    const auth = await getAndLockUserAuthByEmail(
      email,
      activeStatusId,
      client
    );
    
    if (!auth) {
      await insertLoginHistory({
        userId: null,   // unknown user
        sessionId: null,
        tokenId: null,
        authActionTypeId: getStatusId('Invalid Credentials'),
        status: 'failure',
        ipAddress,
        userAgent,
      }, client);
      
      // Do NOT reveal whether email exists or account is inactive
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
    
    // 2. Lockout check
    if (lockout_time && lockout_time > new Date()) {
      await insertLoginHistory({
        userId: user_id,
        sessionId: null,
        tokenId: null,
        authActionTypeId: getStatusId('Account Locked'),
        status: 'failure',
        ipAddress,
        userAgent,
      }, client);
      
      throw AppError.accountLockedError(
        'Account locked. Try again later.',
        { lockoutEndsAt: lockout_time }
      );
    }
    
    // 3. Verify password
    if (!password_hash) {
      logSystemError('Missing password hash during login', {
        context,
        userId: user_id,
        authId: auth_id,
        email,
      });
      
      // Do not expose internal state to client
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    const isValidPassword = await verifyPassword(password_hash, password);
    const newTotalAttempts = attempts + 1;
    
    if (!isValidPassword) {
      await incrementFailedAttempts(
        auth_id,
        newTotalAttempts,
        failed_attempts,
        client
      );
      
      await insertLoginHistory({
        userId: user_id,
        sessionId: null,
        tokenId: null,
        authActionTypeId: getStatusId('Invalid Credentials'),
        status: 'failure',
        ipAddress,
        userAgent,
      }, client);
      
      throw AppError.authenticationError('Invalid email or password.');
    }
    
    // 4. Successful login bookkeeping
    await resetFailedAttemptsAndUpdateLastLogin(
      auth_id,
      newTotalAttempts,
      client
    );
    
    // Enforce single-session policy: revoke all existing sessions and refresh tokens
    await revokeAllSessionsForUser(user_id, client);
    
    // 5. Issue session + tokens
    issued = await issueSessionWithTokens(
      {
        userId: user_id,
        roleId: role_id,
        ipAddress,
        userAgent,
        deviceId,
        note,
      },
      client
    );
    
    if (!issued) {
      throw AppError.generalError('Login succeeded but no tokens were issued.');
    }
    
    // 6. Return finalized response
    return transformLoginResponse({
      accessToken: issued.accessToken,
      refreshToken: issued.refreshToken,
      last_login,
    });
  });
  
  // ------------------------------------------------------------
  // Post-commit audit logging (best effort)
  // ------------------------------------------------------------
  try {
    const loginSuccessActionId = getStatusId('login_success');
    
    await insertLoginHistory({
      userId,
      sessionId: issued.sessionId,
      tokenId: issued.refreshTokenId,
      authActionTypeId: loginSuccessActionId,
      status: 'success',
      ipAddress,
      userAgent,
    }, null);
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
 * Refreshes authentication tokens using a valid refresh token.
 *
 * Domain-level refresh-token rotation flow.
 *
 * Guarantees:
 * - All state mutations occur within a single transaction
 * - Refresh tokens are single-use and rotated on every invocation
 * - Old refresh tokens are revoked before new ones are issued
 * - Refresh token reuse invalidates the associated session
 * - Access tokens are stateless; refresh tokens are stateful and persisted as hashes
 *
 * Responsibilities:
 * - Assert refresh token presence
 * - Verify JWT cryptographically
 * - Validate token persistence state (existence, type, expiry, revocation)
 * - Validate associated session lifecycle state
 * - Detect refresh-token reuse
 * - Rotate refresh token
 * - Persist new refresh token securely (hash only)
 * - Emit structured audit logs
 *
 * Security model:
 * - Does NOT depend on access-token authentication
 * - Reuse of a revoked refresh token is treated as session compromise
 * - This operation is NOT idempotent
 * - Multiple uses of the same refresh token invalidate the session
 *
 * Notes:
 * - Clients MUST replace stored refresh tokens after successful response
 * - HTTP concerns (cookies, headers, status codes) are handled by controllers
 *
 * @param {string | undefined | null} refreshToken
 * @param {Object} context
 * @param {string|null} context.ipAddress
 * @param {string|null} context.userAgent
 *
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 *
 * @throws {AppError}
 * - refreshTokenError
 * - refreshTokenExpiredError
 * - authenticationError
 */
const refreshTokenService = async (
  refreshToken,
  {
    ipAddress = null,
    userAgent = null,
  } = {},
) => {
  const context = 'auth-service/refreshTokenService';
  
  // Refresh token presence is a domain requirement, not an HTTP concern
  if (!refreshToken) {
    throw AppError.refreshTokenError(
      'Refresh token is required. Please log in again.'
    );
  }
  
  // ------------------------------------------------------------
  // 1. Verify JWT cryptographically
  // ------------------------------------------------------------
  // JWT verification proves cryptographic validity only.
  // Persistence, revocation, and session state are enforced below.
  const payload = verifyRefreshJwt(refreshToken);
  
  if (!payload?.id || !payload?.sessionId) {
    throw AppError.refreshTokenError('Invalid refresh token payload');
  }
  
  return withTransaction(async (client) => {
    const user = await getAuthUserById(payload.id, client);
    
    if (!user) {
      throw AppError.authenticationError('User not found');
    }
    
    if (user.status_name !== 'active') {
      throw AppError.authenticationError('User account is inactive');
    }
    
    // ------------------------------------------------------------
    // 2. Validate refresh token persistence state
    // ------------------------------------------------------------
    const token = await validateRefreshTokenState(refreshToken, client);
    
    // ------------------------------------------------------------
    // 3. Validate associated session
    // ------------------------------------------------------------
    const session = await validateSessionState(token.session_id, client);
    
    // ------------------------------------------------------------
    // 4. Rotate refresh token (revoke old)
    // ------------------------------------------------------------
    // Revoke current refresh token and any other outstanding refresh tokens
    // to prevent race-condition replay during concurrent refresh attempts
    await revokeTokenById(token.id, client);
    
    await insertTokenActivityLog({
      userId: payload.id,
      tokenId: token.id,
      eventType: 'revoke',
      status: 'success',
      tokenType: 'refresh',
      ipAddress,
      userAgent,
    }, client);
    
    // ------------------------------------------------------------
    // 5. Issue new tokens
    // ------------------------------------------------------------
    const newAccessToken = signToken({
      id: payload.id,
      role: user.role_id,
      sessionId: session.id,
    });
    
    const newRefreshToken = signToken(
      {
        id: payload.id,
        sessionId: session.id,
        jti: crypto.randomUUID(),
      },
      true
    );
    
    // ------------------------------------------------------------
    // 6. Persist new tokens
    // ------------------------------------------------------------
    const refreshTokenHash = hashToken(newRefreshToken);
    
    const newTokenRow = await insertToken(
      {
        userId: payload.id,
        sessionId: session.id,
        tokenType: 'refresh',
        tokenHash: refreshTokenHash,
        expiresAt: getTokenExpiry(true),
        context: 'refresh',
      },
      client
    );
    
    await insertTokenActivityLog({
      userId: payload.id,
      tokenId: newTokenRow.id,
      eventType: 'refresh',
      status: 'success',
      tokenType: 'refresh',
      ipAddress,
      userAgent,
    }, client);
    
    logSystemInfo('Refresh token rotated', {
      context,
      userId: payload.id,
      sessionId: session.id,
    });
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  });
};

module.exports = {
  loginUserService,
  refreshTokenService,
};
