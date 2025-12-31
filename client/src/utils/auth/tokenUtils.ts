import { jwtDecode } from 'jwt-decode';
import { AppError } from '@utils/error';

/* =========================================================
 * Token validation
 * ======================================================= */

/**
 * Determines whether a JWT access token is still valid based on its `exp` claim.
 *
 * Design notes:
 * - This is a **pure utility function**
 * - It MUST NOT throw, log, or report errors
 * - All failures are treated as "invalid token"
 *
 * Usage:
 * - Guards (route protection)
 * - Token refresh decisions
 * - Silent authentication checks
 *
 * @param accessToken - JWT access token string
 * @returns `true` if the token is structurally valid and not expired; otherwise `false`
 */
export const isTokenValid = (accessToken: string): boolean => {
  try {
    if (!accessToken) {
      return false;
    }
    
    const decoded = jwtDecode<{ exp?: number }>(accessToken);
    
    // Missing or invalid exp → treat as invalid
    if (typeof decoded.exp !== 'number') {
      return false;
    }
    
    // JWT exp is in seconds
    return decoded.exp * 1000 > Date.now();
  } catch {
    // Any decoding error → invalid token
    return false;
  }
};

/**
 * Throws an authentication error if the access token is missing, invalid, or expired.
 *
 * Intended for:
 * - Request guards
 * - Interceptor enforcement
 * - Session validation boundaries
 *
 * Must NOT be used for silent checks.
 *
 * @throws {AppError}
 */
export const assertTokenValid = (accessToken: string): void => {
  if (!isTokenValid(accessToken)) {
    throw AppError.authentication('Access token is missing, invalid, or expired');
  }
};
