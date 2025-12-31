import axiosInstance from '@utils/axiosConfig';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { AppError } from '@utils/error';
import { clearTokens, getToken } from '@utils/auth';
import { selectCsrfToken } from '@features/csrf/state';
import { store } from '@store/store';
import { logoutThunk } from '@features/session/state';
import { postRequest } from '@utils/http';

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

const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  if (!email || !password) {
    throw AppError.validation('Email and password are required', {
      emailProvided: Boolean(email),
      passwordProvided: Boolean(password),
    });
  }
  
  const data =await postRequest<{ email: string; password: string }, LoginResponse>(
    API_ENDPOINTS.SECURITY.SESSION.LOGIN,
    { email, password },
    { policy: 'AUTH' }
  );
  
  const { accessToken, csrfToken } = data;
  
  if (!accessToken || !csrfToken) {
    throw AppError.server('Invalid login response payload', {
      receivedKeys: Object.keys(data ?? {}),
    });
  }
  
  // Explicit auth side effects (intentional)
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

const refreshToken = async (): Promise<{ accessToken: string }> => {
  if (refreshAttemptCount >= MAX_REFRESH_ATTEMPTS) {
    throw AppError.authentication(
      'Session expired. Please log in again.'
    );
  }
  
  refreshAttemptCount += 1;
  
  try {
    const csrfToken = selectCsrfToken(store.getState());
    
    const { accessToken } = await postRequest<void, { accessToken: string }>(
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
    
    axiosInstance.defaults.headers.common.Authorization =
      `Bearer ${accessToken}`;
    
    refreshAttemptCount = 0;
    return { accessToken };
  } catch {
    refreshAttemptCount = 0;
    
    store.dispatch(logoutThunk());
    window.location.href = '/login?expired=true';
    
    throw AppError.authentication('Token refresh failed');
  }
};

/* =========================================================
 * Logout
 * ======================================================= */

const logout = async (): Promise<void> => {
  try {
    await postRequest<void, void>(
      API_ENDPOINTS.SECURITY.SESSION.LOGOUT,
      undefined,
      { policy: 'AUTH' }
    );
  } finally {
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
