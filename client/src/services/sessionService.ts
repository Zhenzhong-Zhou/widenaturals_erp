import {
  LoginApiResponse,
  LoginRequestBody,
  LoginResponseData,
  LogoutApiResponse,
  RefreshTokenApiResponse,
  RefreshTokenResponseData,
} from '@features/session';
import { postRequest, rawAxios } from '@utils/http';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';
import { selectCsrfToken } from '@features/csrf/state';
import { store } from '@store/store';
import { getOrCreateDeviceId } from '@utils/deviceId.ts';

/* =========================================================
 * Login
 * ======================================================= */

/**
 * Performs credential-based authentication against the session API.
 *
 * This service executes the login request and validates the returned
 * authentication payload. It does NOT mutate Redux state directly;
 * state updates are handled by the calling thunk or controller.
 *
 * Responsibilities:
 * - Enforce defensive guards against invalid invocation
 * - Generate and attach a stable device identifier
 * - Invoke the login endpoint using the AUTH HTTP policy
 * - Validate the response envelope and payload shape
 *
 * Explicitly NOT responsible for:
 * - Persisting tokens or cookies
 * - Updating Redux authentication or session state
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
  
  const deviceId = getOrCreateDeviceId();
  
  const response = await postRequest<
    LoginRequestBody,
    LoginApiResponse
  >(
    API_ENDPOINTS.SECURITY.SESSION.LOGIN,
    payload,
    {
      policy: 'AUTH',
      config: {
        headers: {
          'X-Device-Id': deviceId,
        },
      },
    },
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
 * Attempts to obtain a new access token using the refresh token
 * stored in an HTTP-only cookie.
 *
 * Responsibilities:
 * - Enforce a strict, module-scoped retry limit
 * - Attach the required CSRF header for refresh requests
 * - Validate refresh response integrity
 * - Normalize expected unauthenticated outcomes
 *
 * Expected outcomes:
 * - Returns refreshed token data when a valid session exists
 * - Returns null when the user is unauthenticated, refresh is not possible,
 *   or the retry limit has been reached
 *
 * Security notes:
 * - The refresh token is never accessible to JavaScript
 * - This function does not attach an Authorization header
 * - A null return value represents a valid unauthenticated state
 *
 * Side effects:
 * - Mutates a module-scoped refresh retry counter
 *
 * Explicitly out of scope:
 * - Updating Redux session state
 * - Triggering logout or redirects
 * - Clearing cookies or persisted auth artifacts
 *
 * Error semantics:
 * - Authentication-related failures (401, missing tokens) are normalized
 *   to a null return value
 * - Only unexpected system-level failures (network, 5xx) throw errors
 *
 * @returns {Promise<RefreshTokenResponseData | null>}
 *   Refresh response data when successful; null when unauthenticated
 *   or when refresh cannot be performed safely.
 *
 * @throws {AppError}
 *   Thrown only for unexpected system-level failures.
 */
const refreshToken = async (): Promise<RefreshTokenResponseData | null> => {
  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    // Retry budget exhausted — treat as unauthenticated
    return null;
  }
  
  refreshAttemptCount += 1;
  
  try {
    // CSRF token is read synchronously from Redux state
    const csrfToken = selectCsrfToken(store.getState());
    
    if (!csrfToken) {
      return null; // bootstrap-safe
    }
    
    const response = await rawAxios.post<RefreshTokenApiResponse>(
      API_ENDPOINTS.SECURITY.SESSION.REFRESH,
      undefined,
      {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }
    );
    
    if (!response?.data?.success) {
      return null;
    }
    
    const accessToken = response.data.data?.accessToken;
    if (!accessToken) {
      return null;
    }
    
    refreshAttemptCount = 0;
    return { accessToken };
  } catch (error: any) {
    refreshAttemptCount = 0;
    
    if (error?.response?.status === 401) {
      return null; // expected unauthenticated
    }
    
    throw AppError.network('Session refresh failed');
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
