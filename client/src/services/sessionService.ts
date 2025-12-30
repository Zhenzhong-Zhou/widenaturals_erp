import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';
import { clearTokens, getToken } from '@utils/auth';
import { selectCsrfToken } from '@features/csrf/state';
import { store } from '@store/store';
import { logoutThunk } from '@features/session/state';
import { postRequest } from '@utils/apiRequest';

interface LoginResponse {
  accessToken: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  lastLogin: string;
}

/* =========================================================
 * Login
 * ======================================================= */

/**
 * Authenticates a user and initializes client-side auth state.
 *
 * Responsibilities:
 * - Perform domain-level credential validation
 * - Execute login request via centralized transport layer
 * - Apply authentication side effects explicitly (Axios headers)
 *
 * Error behavior:
 * - Throws AppError.validation if credentials are missing
 * - Throws AppError.server if the response payload is invalid
 * - Transport and HTTP errors are normalized upstream
 *
 * @param email - User email address
 * @param password - User password
 *
 * @returns LoginResponse containing tokens and user metadata
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  // ----------------------------
  // Domain validation
  // ----------------------------
  if (!email || !password) {
    throw AppError.validation(
      'Email and password are required',
      {
        emailProvided: Boolean(email),
        passwordProvided: Boolean(password),
      }
    );
  }
  
  // ----------------------------
  // Transport (non-idempotent)
  // ----------------------------
  const data = await postRequest<
    { email: string; password: string },
    LoginResponse
  >(API_ENDPOINTS.SECURITY.SESSION.LOGIN, { email, password });
  
  const { accessToken, csrfToken } = data;
  
  // ----------------------------
  // Defensive payload validation
  // ----------------------------
  if (!accessToken || !csrfToken) {
    throw AppError.server(
      'Invalid login response payload',
      { receivedKeys: Object.keys(data ?? {}) }
    );
  }
  
  // ----------------------------
  // Explicit authentication side effects
  // ----------------------------
  axiosInstance.defaults.headers.common.Authorization =
    `Bearer ${accessToken}`;
  
  axiosInstance.defaults.headers.common['X-CSRF-Token'] =
    csrfToken;
  
  return data;
};

/* =========================================================
 * Token refresh
 * ======================================================= */

let refreshAttemptCount = 0;
const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Refreshes the access token using the active session.
 *
 * Design constraints:
 * - Enforces a hard retry limit to prevent infinite refresh loops
 * - Applies auth header updates explicitly
 * - Forces logout on failure
 *
 * IMPORTANT:
 * - Must NOT log errors directly
 * - Redirects to login on authentication failure
 *
 * @returns An object containing the new access token
 * @throws AppError.authentication when refresh fails
 */
const refreshToken = async (): Promise<{ accessToken: string }> => {
  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    throw AppError.authentication(
      'Session expired. Please log in again.'
    );
  }
  
  refreshAttemptCount += 1;
  
  try {
    const state = store.getState();
    const csrfToken = selectCsrfToken(state);
    
    const { accessToken } = await postRequest<
      void,
      { accessToken: string }
    >(
      API_ENDPOINTS.SECURITY.SESSION.REFRESH,
      undefined,
      {
        config: {
          headers: {
            'X-CSRF-Token': csrfToken,
            Authorization: `Bearer ${getToken('accessToken')}`,
          },
          withCredentials: true,
        },
      }
    );
    
    axiosInstance.defaults.headers.common.Authorization =
      `Bearer ${accessToken}`;
    
    refreshAttemptCount = 0;
    return { accessToken };
  } catch (error: unknown) {
    // Reset counter and force logout on refresh failure
    refreshAttemptCount = 0;
    
    store.dispatch(logoutThunk());
    window.location.href = '/login?expired=true';
    
    throw AppError.authentication(
      'Token refresh failed'
    );
  }
};

/* =========================================================
 * Logout
 * ======================================================= */

/**
 * Logs out the current user and clears local authentication state.
 *
 * Behavior:
 * - Attempts server-side logout (best effort)
 * - Always clears local tokens
 *
 * NOTE:
 * - Server failure must NOT block local logout
 */
const logout = async (): Promise<void> => {
  try {
    await postRequest<void, void>(
      API_ENDPOINTS.SECURITY.SESSION.LOGOUT,
      undefined
    );
  } finally {
    // Local cleanup must always run
    clearTokens();
  }
};

/* =========================================================
 * Export
 * ======================================================= */

export const sessionService = {
  login,
  refreshToken,
  logout,
};
