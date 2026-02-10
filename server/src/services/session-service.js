const { withTransaction } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const {
  getAndLockUserAuthByEmail,
  incrementFailedAttempts,
  resetFailedAttemptsAndUpdateLastLogin,
} = require('../repositories/user-auth-repository');
const { verifyPassword } = require('../business/user-auth-business');
const { logSystemWarn, logSystemInfo } = require('../utils/system-logger');
const { signToken, verifyToken } = require('../utils/auth/jwt-utils');
const { transformLoginResponse } = require('../transformers/session-transformer');
const { issueSessionWithTokens, revokeAllSessionsForUser } = require('../business/auth/session-lifecycle');
const { insertLoginHistory } = require('../repositories/login-history-repository');
const { insertTokenActivityLog } = require('../repositories/token-activity-log-repository');
const { validateRefreshTokenState } = require('../utils/auth/validate-token');
const { validateSessionState } = require('../utils/auth/validate-session');
const { revokeTokenById, insertToken, revokeTokensBySessionAndType } = require('../repositories/token-repository');
const { hashToken } = require('../utils/auth/token-hash');
const { getTokenExpiry } = require('../utils/auth/token-expiry');

/**
 * Authenticates a user using email and password.
 *
 * Guarantees:
 * - All authentication state mutations occur within a single database transaction
 * - Enforces a single-session policy (previous sessions and tokens are revoked)
 * - Returns a finalized, API-ready response on success
 * - Throws on authentication or validation failure
 * - Audit logging is best-effort and never affects control flow
 *
 * Authentication model:
 * - Password-based authentication only
 * - Latest successful login invalidates all prior sessions and refresh tokens
 * - Access tokens are short-lived and stateless; refresh tokens are stateful
 *
 * Security properties:
 * - Does NOT leak user existence or account status
 * - Does NOT expose session or token identifiers to callers
 ugerAgent
 * - Does NOT persist raw tokens (hashes only)
 *
 * Notes:
 * - `deviceId` and `note` are optional metadata for auditing and future policy enforcement
 * - Session and token lifecycle management is handled internally
 *
 * @param {string} email
 * @param {string} password
 * @param {Object} context
 * @param {string|null} context.ipAddress  - Client IP address (optional)
 * @param {string|null} context.userAgent  - Client user agent (optional)
 * @param {string|null} context.deviceId   - Client device identifier (optional)
 * @param {string|null} context.note       - Optional audit note
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string,
 *   lastLogin: string | null
 * }>}
 *
 * @throws {AppError}
 * - authenticationError   (invalid credentials)
 * - accountLockedError    (lockout enforced)
 * - validationError       (invalid input or state)
 * - generalError          (unexpected failures)
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
    if (lockout_time && new Date(lockout_time) > new Date()) {
      throw AppError.accountLockedError(
        'Account locked. Try again later.',
        { lockoutEndsAt: lockout_time }
      );
    }
    
    // 3. Verify password
    if (!password_hash) {
      throw AppError.serviceError('Authentication state is invalid.');
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
      tokenId: issued.accessTokenId,
      authActionTypeId: loginSuccessActionId,
      status: 'success',
      ipAddress,
      userAgent,
    }, null);
    
    await insertTokenActivityLog({
      userId,
      tokenId: issued.accessTokenId,
      eventType: 'generate',
      status: 'success',
      tokenType: 'access',
      ipAddress,
      userAgent,
    }, null);
    
    await insertTokenActivityLog({
      userId,
      tokenId: issued.refreshTokenId,
      eventType: 'generate',
      status: 'success',
      tokenType: 'refresh',
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
 * This service implements the domain-level refresh-token rotation flow.
 * It validates the provided refresh token, enforces persistence and session
 * state, revokes prior credentials, and issues a new access/refresh token pair.
 *
 * Responsibilities:
 * - Assert presence of a refresh token
 * - Cryptographically verify the refresh token (JWT signature & claims)
 * - Validate refresh token persistence state (existence, type, expiry, revocation)
 * - Validate the associated session lifecycle state
 * - Detect refresh-token reuse and revoke compromised sessions
 * - Rotate refresh token and issue a new access token
 * - Persist newly issued tokens securely (hashed only)
 * - Emit structured audit logs on successful rotation
 *
 * Security model:
 * - This service does NOT depend on access-token authentication.
 * - Refresh tokens are single-use and MUST be rotated on every invocation.
 * - Reuse of a revoked refresh token is treated as a session compromise.
 *
 * Notes:
 * - This operation is intentionally NOT idempotent.
 * - Clients MUST replace stored refresh tokens after a successful response.
 * - HTTP concerns (cookies, headers, status codes) are handled by controllers.
 *
 * @param {string | undefined | null} refreshToken
 *   Raw refresh token extracted from an HTTP-only cookie.
 *
 * @returns {Promise<{
 *   accessToken: string,
 *   refreshToken: string
 * }>}
 *
 * @throws {AppError}
 *   - refreshTokenError: missing or invalid refresh token
 *   - refreshTokenExpiredError: expired refresh token
 *   - authenticationError: session invalid or compromised
 */
const refreshTokenService = async (refreshToken) => {
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
  const payload = verifyToken(refreshToken, true);
  
  return withTransaction(async (client) => {
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
    await revokeTokenById(token.id, client);
    
    // Enforce single active access token per session
    // and prevent token replay during refresh rotation
    await revokeTokensBySessionAndType(
      session.id,
      'access',
      client
    );
    
    // ------------------------------------------------------------
    // 5. Issue new tokens
    // ------------------------------------------------------------
    const newAccessToken = signToken({
      id: payload.id,
      role: payload.role,
    });
    
    const newRefreshToken = signToken(
      { id: payload.id, role: payload.role },
      true
    );
    
    // ------------------------------------------------------------
    // 6. Persist new tokens
    // ------------------------------------------------------------
    const accessTokenHash = hashToken(newAccessToken);
    const refreshTokenHash = hashToken(newRefreshToken);
    
    await insertToken(
      {
        userId: payload.id,
        sessionId: session.id,
        tokenType: 'access',
        tokenHash: accessTokenHash,
        expiresAt: getTokenExpiry(false),
        context: 'refresh',
      },
      client
    );
    
    await insertToken(
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
