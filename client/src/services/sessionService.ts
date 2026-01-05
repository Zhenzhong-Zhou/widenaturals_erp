import {
  LoginApiResponse,
  LoginRequestBody,
  LoginResponseData,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  RefreshTokenResponseData,
} from '@features/session';
import { postRequest } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';
import { getToken } from '@utils/auth';
import { selectCsrfToken } from '@features/csrf/state';
import { store } from '@store/store';

/* =========================================================
 * Login
 * ======================================================= */

/**
 * Performs credential-based authentication against the session API.
 *
 * This service is responsible for executing the login request and
 * validating the returned authentication payload. It does NOT
 * mutate Redux state directly; state updates are handled by the
 * calling thunk or controller.
 *
 * Responsibilities:
 * - Enforce defensive guards against invalid invocation
 * - Invoke the login endpoint using the AUTH HTTP policy
 * - Validate the response envelope and payload shape
 *
 * Explicitly NOT responsible for:
 * - Persisting tokens
 * - Updating Redux session state
 * - Triggering navigation or redirects
 *
 * @param email
 *   User email address.
 * @param password
 *   Plaintext password supplied by the user.
 *
 * @returns {Promise<LoginResponseData>}
 *   Authentication payload containing:
 *   - accessToken
 *   - csrfToken
 *   - lastLogin timestamp
 *
 * @throws {AppError}
 *   Validation errors for invalid invocation and server errors
 *   for malformed or incomplete API responses.
 */
const login = async (
  email: string,
  password: string
): Promise<LoginResponseData> => {
  // Defensive guard: service must not be invoked with incomplete credentials
  if (!email || !password) {
    throw AppError.validation('Invalid login invocation', {
      reason: 'Missing credentials',
      emailProvided: Boolean(email),
      passwordProvided: Boolean(password),
    });
  }
  
  const payload: LoginRequestBody = { email, password };
  
  const response = await postRequest<
    LoginRequestBody,
    LoginApiResponse
  >(
    API_ENDPOINTS.SECURITY.SESSION.LOGIN,
    payload,
    { policy: 'AUTH' }
  );
  
  // Validate response envelope
  if (!response?.success || !response.data) {
    throw AppError.server('Invalid login response envelope');
  }
  
  const { accessToken, csrfToken } = response.data;
  
  // Validate required authentication artifacts
  if (!accessToken || !csrfToken) {
    throw AppError.server('Invalid login response payload');
  }
  
  return response.data;
};

/* =========================================================
 * Token refresh
 * ======================================================= */

/**
 * Internal refresh retry counter.
 *
 * This is intentionally module-scoped to prevent
 * unbounded refresh retry loops across concurrent calls.
 */
let refreshAttemptCount = 0;

/**
 * Hard cap for refresh retries to avoid infinite loops
 * caused by expired or revoked refresh tokens.
 */
const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Requests a new access token using the refresh token
 * stored in an HTTP-only cookie.
 *
 * Responsibilities:
 * - Enforce a strict retry limit
 * - Attach required CSRF and Authorization headers
 * - Validate refresh response integrity
 *
 * Security notes:
 * - The refresh token itself is never accessible to JavaScript
 * - Failure indicates an unrecoverable session state
 *
 * Side effects:
 * - Mutates in-memory retry counter
 *
 * Explicitly NOT responsible for:
 * - Updating Redux session state
 * - Redirecting the user
 * - Clearing persisted auth artifacts
 *
 * @returns {Promise<RefreshTokenResponseData>}
 *   Object containing the newly issued access token.
 *
 * @throws {AppError}
 *   Authentication error when refresh fails or retry limit is exceeded.
 */
const refreshToken = async (): Promise<RefreshTokenResponseData> => {
  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    throw AppError.authentication(
      'Session expired. Please log in again.'
    );
  }
  
  refreshAttemptCount += 1;
  
  try {
    // CSRF token is read synchronously from Redux state
    const csrfToken = selectCsrfToken(store.getState());
    
    const response = await postRequest<
      void,
      RefreshTokenApiResponse
    >(
      API_ENDPOINTS.SECURITY.SESSION.REFRESH,
      undefined,
      {
        policy: 'AUTH',
        config: {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${getToken('accessToken')}`,
            'X-CSRF-Token': csrfToken,
          },
        },
      }
    );
    
    // Validate response payload
    if (!response?.success || !response.data?.accessToken) {
      throw AppError.server('Invalid refresh token response payload', {
        receivedKeys: Object.keys(response ?? {}),
      });
    }
    
    // Reset retry counter on success
    refreshAttemptCount = 0;
    
    return response.data;
  } catch {
    // Reset retry counter to avoid poisoning future attempts
    refreshAttemptCount = 0;
    
    // Surface a single, stable authentication failure signal
    throw AppError.authentication('Token refresh failed');
  }
};

/* =========================================================
 * Logout
 * ======================================================= */

/**
 * Terminates the current server-side session.
 *
 * Logout is a destructive operation and does not return
 * any domain data. Client-side state cleanup and navigation
 * are handled by the caller.
 *
 * Explicitly NOT responsible for:
 * - Clearing Redux session state
 * - Removing stored tokens
 * - Triggering redirects
 */
const logout = async (): Promise<void> => {
  await postRequest<void, LogoutApiResponse>(
    API_ENDPOINTS.SECURITY.SESSION.LOGOUT,
    undefined,
    { policy: 'AUTH' }
  );
};

/* =========================================================
 * Export
 * ======================================================= */

export const sessionService = {
  login,
  refreshToken,
  logout,
};
